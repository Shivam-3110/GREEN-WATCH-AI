import xgboost as xgb
import numpy as np
import joblib
import os
from app.utils.preprocessor import prepare_input, aqi_to_category, get_health_advice, FEATURES

MODEL_DIR  = os.path.join(os.path.dirname(__file__), '..', '..', 'saved_models')
# This legacy service uses the pollutant/weather feature schema trained by
# training/train.py. The historical one-hour AQI model is loaded separately by
# aqi_prediction_service.one_hour_inference.
MODEL_PATH = os.path.join(MODEL_DIR, 'aqi_pollutant_legacy_24h.json')

# Decay factors for physics-based fallback (pollutant dispersion over 24h)
HOUR_DECAY = np.array([
    1.00, 0.98, 0.96, 0.94, 0.93, 0.92,
    0.91, 0.90, 0.91, 0.93, 0.95, 0.97,
    0.99, 1.01, 1.02, 1.01, 0.99, 0.97,
    0.95, 0.93, 0.91, 0.90, 0.91, 0.92,
], dtype=np.float32)


class AQIPredictionService:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = xgb.XGBRegressor()
                self.model.load_model(MODEL_PATH)
                self.model_loaded = True
                print(f'✅ XGBoost model loaded from {MODEL_PATH}')
            except Exception as e:
                print(f'⚠️  Failed to load XGBoost model: {e}. Using physics-based fallback.')
                self.model_loaded = False
        else:
            print('📊 No trained model found. Using physics-based fallback (run training/train.py).')
            self.model_loaded = False

    def predict(self, input_data: dict) -> dict:
        current_aqi = self._calculate_current_aqi(input_data)

        if self.model_loaded:
            predictions = self._xgboost_predict(input_data)
            confidence  = 0.91
        else:
            predictions = self._physics_predict(current_aqi, input_data)
            confidence  = 0.72

        forecast_points = []
        for i, pred in enumerate(predictions):
            aqi_val  = round(float(np.clip(pred, 0, 500)), 1)
            ratio    = aqi_val / max(current_aqi, 1)
            pm25_val = round(max(input_data['pm25'] * HOUR_DECAY[i] * ratio, 0), 1)
            pm10_val = round(max(input_data['pm10'] * HOUR_DECAY[i] * ratio, 0), 1)
            category, color = aqi_to_category(aqi_val)

            forecast_points.append({
                'hour': i + 1,
                'label': f'+{i + 1}h',
                'aqi': aqi_val,
                'pm25': pm25_val,
                'pm10': pm10_val,
                'category': category,
                'color': color,
            })

        category, _ = aqi_to_category(current_aqi)

        return {
            'current_aqi':      round(current_aqi, 1),
            'current_category': category,
            'predictions':      forecast_points,
            'health_advice':    get_health_advice(current_aqi),
            'model_confidence': confidence,
        }

    def _xgboost_predict(self, input_data: dict) -> np.ndarray:
        """
        XGBoost predicts one AQI value per hour offset.
        We build 24 feature rows — one per forecast hour — each with an added
        'hour_offset' feature so the model knows which hour it's predicting.
        """
        base_features = prepare_input(input_data)  # (1, 8)
        rows = []
        for h in range(1, 25):
            hour_feature = np.array([[h]], dtype=np.float32)
            rows.append(np.hstack([base_features, hour_feature]))  # (1, 9)

        X = np.vstack(rows)  # (24, 9)
        return self.model.predict(X)  # (24,)

    def _physics_predict(self, current_aqi: float, data: dict) -> np.ndarray:
        base           = current_aqi * HOUR_DECAY
        temp_factor    = 1 + max(0, (data['temperature'] - 25) * 0.005)
        humidity_factor = 1 + max(0, (data['humidity'] - 60) * 0.002)
        return np.clip(base * temp_factor * humidity_factor, 0, 500)

    def _calculate_current_aqi(self, data: dict) -> float:
        return max(self._pm25_to_aqi(data['pm25']), self._pm10_to_aqi(data['pm10']))

    def _pm25_to_aqi(self, pm25: float) -> float:
        return self._calc_aqi(pm25, [
            (0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100),
            (35.5, 55.4, 101, 150), (55.5, 150.4, 151, 200),
            (150.5, 250.4, 201, 300), (250.5, 500.4, 301, 500),
        ])

    def _pm10_to_aqi(self, pm10: float) -> float:
        return self._calc_aqi(pm10, [
            (0, 54, 0, 50), (55, 154, 51, 100),
            (155, 254, 101, 150), (255, 354, 151, 200),
            (355, 424, 201, 300), (425, 604, 301, 500),
        ])

    def _calc_aqi(self, concentration: float, breakpoints: list) -> float:
        for c_low, c_high, i_low, i_high in breakpoints:
            if c_low <= concentration <= c_high:
                return ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
        return 500.0


aqi_prediction_service = AQIPredictionService()
