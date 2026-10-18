import numpy as np
import joblib
import os

FEATURES = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity']

SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'saved_models', 'scaler.pkl')


def get_scaler():
    if os.path.exists(SCALER_PATH):
        return joblib.load(SCALER_PATH)
    return None


def prepare_input(data: dict) -> np.ndarray:
    """Prepare input features as a 2D array for XGBoost."""
    scaler = get_scaler()
    values = np.array([[data[f] for f in FEATURES]], dtype=np.float32)
    if scaler:
        return scaler.transform(values)
    return values


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
