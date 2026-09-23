"""
AQI LSTM Training Script
========================
Downloads real AQI data from OpenWeatherMap, trains the LSTM model,
and saves it to saved_models/aqi_lstm.pt

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
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib
import requests
from dotenv import load_dotenv

# Add parent dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.models.lstm_model import AQILSTMModel

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY        = os.getenv('OPENWEATHER_API_KEY')
SAVED_DIR      = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
MODEL_PATH     = os.path.join(SAVED_DIR, 'aqi_lstm.pt')
SCALER_PATH    = os.path.join(SAVED_DIR, 'scaler.pkl')
SEQ_LEN        = 24      # use past 24 hours to predict next 24 hours
EPOCHS         = 50
BATCH_SIZE     = 32
LR             = 0.001
DEVICE         = 'cuda' if torch.cuda.is_available() else 'cpu'
FEATURES       = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity']

# Cities to collect training data from (lat, lon)
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


def fetch_aqi_history(lat: float, lon: float) -> list:
    """Fetch past 5 days of hourly AQI data from OpenWeatherMap."""
    end   = int(time.time())
    start = end - (5 * 24 * 3600)  # 5 days back

    try:
        aq_resp = requests.get(
            'https://api.openweathermap.org/data/2.5/air_pollution/history',
            params={'lat': lat, 'lon': lon, 'start': start, 'end': end, 'appid': API_KEY},
            timeout=15,
        )
        aq_resp.raise_for_status()
        aq_list = aq_resp.json().get('list', [])

        records = []
        for item in aq_list:
            c = item['components']
            records.append({
                'timestamp': item['dt'],
                'pm25': c.get('pm2_5', 0),
                'pm10': c.get('pm10', 0),
                'no2':  c.get('no2', 0),
                'so2':  c.get('so2', 0),
                'co':   c.get('co', 0),
                'o3':   c.get('o3', 0),
            })
        return records
    except Exception as e:
        print(f'  ⚠️  Failed for ({lat}, {lon}): {e}')
        return []


def fetch_weather_history(lat: float, lon: float, timestamps: list) -> dict:
    """Fetch temperature and humidity for given timestamps."""
    weather = {}
    try:
        # Use current weather as approximation for historical (free tier limitation)
        resp = requests.get(
            'https://api.openweathermap.org/data/2.5/weather',
            params={'lat': lat, 'lon': lon, 'appid': API_KEY, 'units': 'metric'},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        temp     = data['main'].get('temp', 25)
        humidity = data['main'].get('humidity', 50)
        for ts in timestamps:
            weather[ts] = {'temperature': temp, 'humidity': humidity}
    except Exception:
        for ts in timestamps:
            weather[ts] = {'temperature': 25, 'humidity': 50}
    return weather


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


def collect_data() -> pd.DataFrame:
    print(f'\n📡 Collecting AQI data from {len(CITIES)} cities...')
    all_records = []

    for lat, lon in CITIES:
        print(f'  Fetching ({lat}, {lon})...')
        records = fetch_aqi_history(lat, lon)
        if not records:
            continue

        timestamps = [r['timestamp'] for r in records]
        weather    = fetch_weather_history(lat, lon, timestamps)

        for r in records:
            ts = r['timestamp']
            w  = weather.get(ts, {'temperature': 25, 'humidity': 50})
            all_records.append({
                'pm25':        r['pm25'],
                'pm10':        r['pm10'],
                'no2':         r['no2'],
                'so2':         r['so2'],
                'co':          r['co'],
                'o3':          r['o3'],
                'temperature': w['temperature'],
                'humidity':    w['humidity'],
                'aqi':         pm25_to_aqi(r['pm25']),
            })

    df = pd.DataFrame(all_records)
    print(f'  ✅ Collected {len(df)} records from {len(CITIES)} cities')
    return df


def generate_synthetic_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generate synthetic AQI training data when API key is not available.
    Uses realistic pollutant correlations.
    """
    print('\n🔧 Generating synthetic training data...')
    np.random.seed(42)

    # Simulate daily cycles
    hours = np.arange(n_samples)
    daily_cycle = np.sin(2 * np.pi * hours / 24)
    weekly_cycle = np.sin(2 * np.pi * hours / (24 * 7))

    pm25 = np.clip(30 + 20 * daily_cycle + 10 * weekly_cycle + np.random.normal(0, 8, n_samples), 0, 300)
    pm10 = np.clip(pm25 * 1.8 + np.random.normal(0, 10, n_samples), 0, 500)
    no2  = np.clip(25 + 15 * daily_cycle + np.random.normal(0, 5, n_samples), 0, 200)
    so2  = np.clip(10 + 5 * daily_cycle + np.random.normal(0, 3, n_samples), 0, 350)
    co   = np.clip(500 + 300 * daily_cycle + np.random.normal(0, 100, n_samples), 0, 15000)
    o3   = np.clip(40 + 30 * np.abs(daily_cycle) + np.random.normal(0, 8, n_samples), 0, 180)
    temp = 20 + 10 * np.sin(2 * np.pi * hours / (24 * 365)) + 5 * daily_cycle + np.random.normal(0, 2, n_samples)
    hum  = np.clip(60 - 20 * daily_cycle + np.random.normal(0, 10, n_samples), 0, 100)

    aqi = np.array([pm25_to_aqi(v) for v in pm25])

    df = pd.DataFrame({
        'pm25': pm25, 'pm10': pm10, 'no2': no2, 'so2': so2,
        'co': co, 'o3': o3, 'temperature': temp, 'humidity': hum, 'aqi': aqi,
    })
    print(f'  ✅ Generated {len(df)} synthetic records')
    return df


def build_sequences(df: pd.DataFrame, scaler: MinMaxScaler):
    """Build (X, y) sequences for LSTM training."""
    feature_data = scaler.transform(df[FEATURES].values)
    aqi_data     = df['aqi'].values

    X, y = [], []
    for i in range(len(df) - SEQ_LEN - 24):
        X.append(feature_data[i: i + SEQ_LEN])
        # Normalize target AQI to [0, 1]
        y.append(aqi_data[i + SEQ_LEN: i + SEQ_LEN + 24] / 300.0)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


def train():
    os.makedirs(SAVED_DIR, exist_ok=True)
    print(f'\n🖥️  Training on: {DEVICE.upper()}')

    # ── Data collection ───────────────────────────────────────────────────────
    if API_KEY and API_KEY != 'your_openweather_api_key_here':
        df = collect_data()
        if len(df) < 200:
            print('  ⚠️  Not enough real data, supplementing with synthetic data')
            df = pd.concat([df, generate_synthetic_data(3000)], ignore_index=True)
    else:
        print('  ℹ️  No API key found — using synthetic data')
        df = generate_synthetic_data(5000)

    df = df.dropna().reset_index(drop=True)
    print(f'\n📊 Total training records: {len(df)}')
    print(f'   AQI range: {df["aqi"].min():.1f} – {df["aqi"].max():.1f}')

    # ── Preprocessing ─────────────────────────────────────────────────────────
    scaler = MinMaxScaler()
    scaler.fit(df[FEATURES].values)
    joblib.dump(scaler, SCALER_PATH)
    print(f'💾 Scaler saved to {SCALER_PATH}')

    X, y = build_sequences(df, scaler)
    print(f'   Sequences built: X={X.shape}, y={y.shape}')

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.15, random_state=42)

    train_loader = DataLoader(TensorDataset(torch.tensor(X_train), torch.tensor(y_train)), batch_size=BATCH_SIZE, shuffle=True)
    val_loader   = DataLoader(TensorDataset(torch.tensor(X_val),   torch.tensor(y_val)),   batch_size=BATCH_SIZE)

    # ── Model ─────────────────────────────────────────────────────────────────
    model     = AQILSTMModel(input_size=len(FEATURES), hidden_size=128, num_layers=2, output_size=24).to(DEVICE)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    criterion = nn.MSELoss()

    print(f'\n🏋️  Training LSTM for {EPOCHS} epochs...\n')
    best_val_loss = float('inf')

    for epoch in range(1, EPOCHS + 1):
        # Train
        model.train()
        train_loss = 0
        for xb, yb in train_loader:
            xb, yb = xb.to(DEVICE), yb.to(DEVICE)
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()

        # Validate
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb, yb = xb.to(DEVICE), yb.to(DEVICE)
                val_loss += criterion(model(xb), yb).item()

        train_loss /= len(train_loader)
        val_loss   /= len(val_loader)
        scheduler.step(val_loss)

        if epoch % 5 == 0 or epoch == 1:
            print(f'  Epoch {epoch:3d}/{EPOCHS} | Train Loss: {train_loss:.5f} | Val Loss: {val_loss:.5f}')

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), MODEL_PATH)

    print(f'\n✅ Training complete! Best val loss: {best_val_loss:.5f}')
    print(f'💾 Model saved to {MODEL_PATH}')
    print('\n🚀 Now restart the server — it will auto-load the trained model.')


if __name__ == '__main__':
    train()
