import numpy as np
import joblib
import os

SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'saved_models', 'scaler.pkl')

FEATURES = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity']

# Typical ranges for normalization fallback (when no scaler is trained yet)
FEATURE_RANGES = {
    'pm25':        (0, 300),
    'pm10':        (0, 500),
    'no2':         (0, 200),
    'so2':         (0, 350),
    'co':          (0, 15000),
    'o3':          (0, 180),
    'temperature': (-10, 50),
    'humidity':    (0, 100),
}


def get_scaler():
    if os.path.exists(SCALER_PATH):
        return joblib.load(SCALER_PATH)
    return None


def normalize_input(data: dict) -> np.ndarray:
    """Normalize input features to [0, 1] range."""
    scaler = get_scaler()
    values = np.array([[data[f] for f in FEATURES]], dtype=np.float32)

    if scaler:
        return scaler.transform(values)

    # Fallback: manual min-max normalization
    normalized = []
    for i, feature in enumerate(FEATURES):
        min_val, max_val = FEATURE_RANGES[feature]
        val = np.clip(values[0][i], min_val, max_val)
        normalized.append((val - min_val) / (max_val - min_val))

    return np.array([normalized], dtype=np.float32)


def aqi_to_category(aqi: float) -> tuple[str, str]:
    """Returns (category, hex_color)"""
    if aqi <= 50:
        return 'Good', '#34d399'
    elif aqi <= 100:
        return 'Moderate', '#fbbf24'
    elif aqi <= 150:
        return 'Poor', '#f97316'
    elif aqi <= 200:
        return 'Very Poor', '#ef4444'
    else:
        return 'Severe', '#7c2d12'


def get_health_advice(aqi: float) -> str:
    if aqi <= 50:
        return 'Air quality is excellent. Safe for all outdoor activities.'
    elif aqi <= 100:
        return 'Acceptable air quality. Sensitive groups should limit prolonged outdoor exertion.'
    elif aqi <= 150:
        return 'Unhealthy for sensitive groups. Everyone should reduce prolonged outdoor activity.'
    elif aqi <= 200:
        return 'Unhealthy. Everyone may experience health effects. Avoid outdoor activity.'
    else:
        return 'Hazardous. Health emergency. Stay indoors and avoid all outdoor exposure.'
