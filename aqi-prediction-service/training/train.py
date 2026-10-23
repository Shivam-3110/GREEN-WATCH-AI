"""
AQI XGBoost Training Script
============================
Collects AQI data from OpenWeatherMap, trains an XGBoost model,
    and saves it to saved_models/aqi_pollutant_legacy_24h.json

Usage:
    cd aqi-prediction-service
    python training/train.py

Requirements:
    - OPENWEATHER_API_KEY in .env
    - pip install -r requirements.txt
"""

import os
import sys
import time
import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
import requests
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, r2_score
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY    = os.getenv('OPENWEATHER_API_KEY')
SAVED_DIR  = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
MODEL_PATH = os.path.join(SAVED_DIR, 'aqi_pollutant_legacy_24h.json')
SCALER_PATH = os.path.join(SAVED_DIR, 'scaler.pkl')
FEATURES   = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity']

CITIES = [
    (28.6139, 77.2090),   # Delhi
    (19.0760, 72.8777),   # Mumbai
    (12.9716, 77.5946),   # Bangalore
    (22.5726, 88.3639),   # Kolkata
    (13.0827, 80.2707),   # Chennai
    (40.7128, -74.0060),  # New York
    (51.5074, -0.1278),   # London
    (35.6762, 139.6503),  # Tokyo
    (39.9042, 116.4074),  # Beijing
    (48.8566, 2.3522),    # Paris
]
# ──────────────────────────────────────────────────────────────────────────────


def pm25_to_aqi(pm25: float) -> float:
    breakpoints = [
        (0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150), (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300), (250.5, 500.4, 301, 500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= pm25 <= c_hi:
            return ((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo
    return 500.0


def fetch_aqi_history(lat: float, lon: float) -> list:
    end   = int(time.time())
    start = end - (5 * 24 * 3600)
    try:
        resp = requests.get(
            'https://api.openweathermap.org/data/2.5/air_pollution/history',
            params={'lat': lat, 'lon': lon, 'start': start, 'end': end, 'appid': API_KEY},
            timeout=15,
        )
        resp.raise_for_status()
        records = []
        for item in resp.json().get('list', []):
            c = item['components']
            records.append({
                'timestamp': item['dt'],
                'pm25': c.get('pm2_5', 0), 'pm10': c.get('pm10', 0),
                'no2':  c.get('no2', 0),   'so2':  c.get('so2', 0),
                'co':   c.get('co', 0),    'o3':   c.get('o3', 0),
            })
        return records
    except Exception as e:
        print(f'  ⚠️  Failed ({lat}, {lon}): {e}')
        return []


def fetch_weather(lat: float, lon: float) -> dict:
    try:
        resp = requests.get(
            'https://api.openweathermap.org/data/2.5/weather',
            params={'lat': lat, 'lon': lon, 'appid': API_KEY, 'units': 'metric'},
            timeout=10,
        )
        resp.raise_for_status()
        d = resp.json()
        return {'temperature': d['main'].get('temp', 25), 'humidity': d['main'].get('humidity', 50)}
    except Exception:
        return {'temperature': 25, 'humidity': 50}


def collect_data() -> pd.DataFrame:
    print(f'\n📡 Collecting data from {len(CITIES)} cities...')
    records = []
    for lat, lon in CITIES:
        print(f'  Fetching ({lat}, {lon})...')
        history = fetch_aqi_history(lat, lon)
        if not history:
            continue
        weather = fetch_weather(lat, lon)
        for r in history:
            records.append({**r, **weather, 'aqi': pm25_to_aqi(r['pm25'])})

    df = pd.DataFrame(records)
    print(f'  ✅ Collected {len(df)} records')
    return df


def generate_synthetic_data(n: int = 5000) -> pd.DataFrame:
    print('\n🔧 Generating synthetic training data...')
    np.random.seed(42)
    hours        = np.arange(n)
    daily_cycle  = np.sin(2 * np.pi * hours / 24)
    weekly_cycle = np.sin(2 * np.pi * hours / (24 * 7))

    pm25 = np.clip(30 + 20 * daily_cycle + 10 * weekly_cycle + np.random.normal(0, 8, n), 0, 300)
    pm10 = np.clip(pm25 * 1.8 + np.random.normal(0, 10, n), 0, 500)
    no2  = np.clip(25 + 15 * daily_cycle + np.random.normal(0, 5, n), 0, 200)
    so2  = np.clip(10 + 5  * daily_cycle + np.random.normal(0, 3, n), 0, 350)
    co   = np.clip(500 + 300 * daily_cycle + np.random.normal(0, 100, n), 0, 15000)
    o3   = np.clip(40 + 30 * np.abs(daily_cycle) + np.random.normal(0, 8, n), 0, 180)
    temp = 20 + 10 * np.sin(2 * np.pi * hours / (24 * 365)) + 5 * daily_cycle + np.random.normal(0, 2, n)
    hum  = np.clip(60 - 20 * daily_cycle + np.random.normal(0, 10, n), 0, 100)
    aqi  = np.array([pm25_to_aqi(v) for v in pm25])

    print(f'  ✅ Generated {n} synthetic records')
    return pd.DataFrame({
        'pm25': pm25, 'pm10': pm10, 'no2': no2, 'so2': so2,
        'co': co, 'o3': o3, 'temperature': temp, 'humidity': hum, 'aqi': aqi,
    })


def build_xgboost_dataset(df: pd.DataFrame, scaler: MinMaxScaler):
    """
    XGBoost predicts AQI for a specific future hour.
    Each row = current pollutant snapshot + hour_offset (1-24) → target AQI at that offset.
    """
    scaled = scaler.transform(df[FEATURES].values)
    X, y   = [], []

    for i in range(len(df) - 24):
        base_row = scaled[i]
        for h in range(1, 25):
            # Feature: current snapshot + which hour we're predicting
            X.append(np.append(base_row, h))
            # Target: actual AQI at hour offset h
            y.append(df['aqi'].iloc[i + h])

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


def train():
    os.makedirs(SAVED_DIR, exist_ok=True)

    # ── Data ──────────────────────────────────────────────────────────────────
    if API_KEY and API_KEY != 'your_openweather_api_key_here':
        df = collect_data()
        if len(df) < 200:
            print('  ⚠️  Not enough real data, supplementing with synthetic')
            df = pd.concat([df, generate_synthetic_data(3000)], ignore_index=True)
    else:
        print('\nℹ️  No API key — using synthetic data')
        df = generate_synthetic_data(5000)

    df = df.dropna().reset_index(drop=True)
    print(f'\n📊 Total records: {len(df)} | AQI range: {df["aqi"].min():.1f} – {df["aqi"].max():.1f}')

    # ── Scaler ────────────────────────────────────────────────────────────────
    scaler = MinMaxScaler()
    scaler.fit(df[FEATURES].values)
    joblib.dump(scaler, SCALER_PATH)
    print(f'💾 Scaler saved → {SCALER_PATH}')

    # ── Build dataset ─────────────────────────────────────────────────────────
    X, y = build_xgboost_dataset(df, scaler)
    print(f'   Dataset: X={X.shape}, y={y.shape}')

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.15, random_state=42)

    # ── Train XGBoost ─────────────────────────────────────────────────────────
    print('\n🏋️  Training XGBoost...')
    model = xgb.XGBRegressor(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
        tree_method='hist',       # fast histogram method
        device='cuda',            # uses your RTX 2050 automatically, falls back to cpu
        early_stopping_rounds=20,
        eval_metric='mae',
        verbosity=1,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )

    # ── Evaluate ──────────────────────────────────────────────────────────────
    preds = model.predict(X_val)
    mae   = mean_absolute_error(y_val, preds)
    r2    = r2_score(y_val, preds)
    print(f'\n📈 Validation MAE: {mae:.2f} AQI points')
    print(f'   R² Score:       {r2:.4f}')

    # ── Save ──────────────────────────────────────────────────────────────────
    model.save_model(MODEL_PATH)
    print(f'💾 Model saved → {MODEL_PATH}')
    print('\n🚀 Restart the server — it will auto-load the trained XGBoost model.')


if __name__ == '__main__':
    train()
