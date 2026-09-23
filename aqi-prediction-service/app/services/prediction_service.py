import torch
import numpy as np
import os
from app.models.lstm_model import AQILSTMModel
from app.utils.preprocessor import normalize_input, aqi_to_category, get_health_advice, FEATURES

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'saved_models', 'aqi_lstm.pt')

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# Decay factors simulating how pollutants disperse over 24 hours
HOUR_DECAY = np.array([
    1.00, 0.98, 0.96, 0.94, 0.93, 0.92,   # hours 1-6
    0.91, 0.90, 0.91, 0.93, 0.95, 0.97,   # hours 7-12
    0.99, 1.01, 1.02, 1.01, 0.99, 0.97,   # hours 13-18
    0.95, 0.93, 0.91, 0.90, 0.91, 0.92,   # hours 19-24
], dtype=np.float32)


class AQIPredictionService:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.device = DEVICE
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = AQILSTMModel().to(self.device)
                self.model.load_state_dict(torch.load(MODEL_PATH, map_location=self.device))
                self.model.eval()
                self.model_loaded = True
                print(f"✅ LSTM model loaded from {MODEL_PATH} on {self.device.upper()}")
            except Exception as e:
                print(f"⚠️  Failed to load model: {e}. Using physics-based fallback.")
                self.model_loaded = False
        else:
            print("📊 No trained model found. Using physics-based prediction (train model for better accuracy).")
            self.model_loaded = False

    def predict(self, input_data: dict) -> dict:
        """
        Predict AQI for next 24 hours.
        Uses LSTM if trained model exists, otherwise physics-based fallback.
        """
        current_aqi = self._calculate_current_aqi(input_data)

        if self.model_loaded:
            predictions = self._lstm_predict(input_data, current_aqi)
            confidence = 0.89
        else:
            predictions = self._physics_predict(current_aqi, input_data)
            confidence = 0.72

        forecast_points = []
        for i, pred in enumerate(predictions):
            aqi_val = round(float(pred), 1)
            pm25_val = round(input_data['pm25'] * HOUR_DECAY[i] * (aqi_val / max(current_aqi, 1)), 1)
            pm10_val = round(input_data['pm10'] * HOUR_DECAY[i] * (aqi_val / max(current_aqi, 1)), 1)
            category, color = aqi_to_category(aqi_val)

            forecast_points.append({
                'hour': i + 1,
                'label': f'+{i + 1}h',
                'aqi': aqi_val,
                'pm25': max(pm25_val, 0),
                'pm10': max(pm10_val, 0),
                'category': category,
                'color': color,
            })

        category, _ = aqi_to_category(current_aqi)

        return {
            'current_aqi': round(current_aqi, 1),
            'current_category': category,
            'predictions': forecast_points,
            'health_advice': get_health_advice(current_aqi),
            'model_confidence': confidence,
        }

    def _calculate_current_aqi(self, data: dict) -> float:
        """Calculate AQI from pollutant concentrations using US EPA breakpoints."""
        pm25_aqi = self._pm25_to_aqi(data['pm25'])
        pm10_aqi = self._pm10_to_aqi(data['pm10'])
        return max(pm25_aqi, pm10_aqi)

    def _lstm_predict(self, input_data: dict, current_aqi: float) -> np.ndarray:
        """Run LSTM inference."""
        normalized = normalize_input(input_data)  # (1, 8)
        # Repeat as sequence of 24 timesteps (simulates past 24h with same reading)
        seq = np.repeat(normalized, 24, axis=0)    # (24, 8)
        tensor = torch.tensor(seq, dtype=torch.float32).unsqueeze(0).to(self.device)  # (1, 24, 8)

        with torch.no_grad():
            output = self.model(tensor)  # (1, 24)

        raw = output.squeeze(0).cpu().numpy()
        # Scale output back to AQI range (model outputs normalized 0-1)
        return np.clip(raw * 300, 0, 500)

    def _physics_predict(self, current_aqi: float, data: dict) -> np.ndarray:
        """Physics-based fallback using pollutant decay patterns."""
        base = current_aqi * HOUR_DECAY
        # Add temperature effect: higher temp → higher ozone → higher AQI
        temp_factor = 1 + max(0, (data['temperature'] - 25) * 0.005)
        # Add humidity effect: high humidity traps particles
        humidity_factor = 1 + max(0, (data['humidity'] - 60) * 0.002)
        return np.clip(base * temp_factor * humidity_factor, 0, 500)

    def _pm25_to_aqi(self, pm25: float) -> float:
        breakpoints = [
            (0.0, 12.0, 0, 50),
            (12.1, 35.4, 51, 100),
            (35.5, 55.4, 101, 150),
            (55.5, 150.4, 151, 200),
            (150.5, 250.4, 201, 300),
            (250.5, 500.4, 301, 500),
        ]
        return self._calc_aqi(pm25, breakpoints)

    def _pm10_to_aqi(self, pm10: float) -> float:
        breakpoints = [
            (0, 54, 0, 50),
            (55, 154, 51, 100),
            (155, 254, 101, 150),
            (255, 354, 151, 200),
            (355, 424, 201, 300),
            (425, 604, 301, 500),
        ]
        return self._calc_aqi(pm10, breakpoints)

    def _calc_aqi(self, concentration: float, breakpoints: list) -> float:
        for c_low, c_high, i_low, i_high in breakpoints:
            if c_low <= concentration <= c_high:
                return ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
        return 500.0


aqi_prediction_service = AQIPredictionService()
