"""Local inference for the saved Lucknow AQI one-hour model."""
from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd
from xgboost import XGBRegressor

from aqi_prediction_service.feature_engineering import FEATURE_NAMES, build_inference_features

DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[2] / "saved_models"


class OneHourAQIPredictor:
    """Load once and return a numeric AQI forecast for the next hour."""

    def __init__(self, model_path: str | Path | None = None):
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_DIR / "aqi_xgboost.json"
        metadata_path = self.model_path.with_name("aqi_xgboost_metadata.json")
        if not self.model_path.is_file():
            raise FileNotFoundError(f"Saved model not found: {self.model_path}")
        if not metadata_path.is_file():
            raise FileNotFoundError(f"Model metadata not found: {metadata_path}")
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if metadata.get("feature_names") != FEATURE_NAMES or metadata.get("prediction_horizon_hours") != 1:
            raise ValueError("Saved model metadata does not match the one-hour feature schema")
        self.model = XGBRegressor()
        self.model.load_model(self.model_path)
        model_feature_names = self.model.get_booster().feature_names
        if model_feature_names is not None and model_feature_names != FEATURE_NAMES:
            raise ValueError("Saved model feature ordering does not match inference preprocessing")

    def predict(self, history: pd.DataFrame) -> float:
        """Predict AQI(t+1) from timestamp/AQI observations through time t."""
        features = build_inference_features(history)
        prediction = float(self.model.predict(features)[0])
        if not math.isfinite(prediction):
            raise ValueError("Model returned a non-finite AQI prediction")
        return max(0.0, min(500.0, prediction))


def predict_one_hour(history: pd.DataFrame, model_path: str | Path | None = None) -> float:
    """Convenience wrapper for one-off local predictions."""
    return OneHourAQIPredictor(model_path).predict(history)
