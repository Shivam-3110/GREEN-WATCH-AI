"""Recursive multi-hour forecasting using the shared one-hour AQI model."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Protocol

import numpy as np
import pandas as pd

from aqi_prediction_service.one_hour_inference import OneHourAQIPredictor

DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[2] / "saved_models"
FORECAST_COLUMNS = ["forecast_start", "timestamp", "horizon", "predicted_AQI"]


class Predictor(Protocol):
    def predict(self, history: pd.DataFrame) -> float: ...


def required_history_positions(metadata_path: str | Path) -> int:
    """Derive history length from model features and verify its metadata."""
    metadata = json.loads(Path(metadata_path).read_text(encoding="utf-8"))
    feature_names = metadata.get("feature_names", [])
    lag_hours = [int(name.removeprefix("lag_")) for name in feature_names if name.startswith("lag_")]
    if not lag_hours:
        raise ValueError("Model metadata has no AQI lag features")
    minimum = max(lag_hours) + 1
    declared = metadata.get("expected_input_schema", {}).get("minimum_history")
    if declared:
        digits = "".join(character for character in str(declared).split()[0] if character.isdigit())
        if digits and int(digits) != minimum:
            raise ValueError("Metadata minimum history conflicts with the model lag features")
    return minimum


def validate_history(history: pd.DataFrame, forecast_start: str | pd.Timestamp) -> tuple[pd.DataFrame, pd.Timestamp]:
    """Validate ordered input and retain only observations available at origin."""
    if not {"timestamp", "AQI"}.issubset(history.columns):
        raise ValueError("history must contain timestamp and AQI columns")
    frame = history[["timestamp", "AQI"]].copy()
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="raise")
    if frame.empty or frame.timestamp.isna().any():
        raise ValueError("history must contain timestamped AQI observations")
    if frame.timestamp.duplicated().any():
        raise ValueError("history must not contain duplicate timestamps")
    if not frame.timestamp.is_monotonic_increasing:
        raise ValueError("history timestamps must be sorted in ascending order")
    if not pd.api.types.is_numeric_dtype(frame.AQI):
        raise ValueError("AQI observations must be numeric")
    origin = pd.Timestamp(forecast_start)
    if pd.isna(origin) or origin.minute or origin.second or origin.microsecond or origin.nanosecond:
        raise ValueError("forecast_start must be an exact hourly timestamp")
    frame = frame.loc[frame.timestamp <= origin].copy()
    if frame.empty or frame.timestamp.iloc[-1] != origin:
        raise ValueError("history must contain an observed AQI at forecast_start")
    values = frame.AQI.dropna().to_numpy(dtype=float)
    if not np.isfinite(values).all() or ((values < 0) | (values > 500)).any():
        raise ValueError("observed AQI values must be finite and between 0 and 500")
    if pd.isna(frame.AQI.iloc[-1]):
        raise ValueError("AQI at forecast_start must be observed")
    return frame.reset_index(drop=True), origin


def forecast_24h(
    history: pd.DataFrame,
    forecast_start: str | pd.Timestamp,
    predictor: Predictor | None = None,
    *,
    model_path: str | Path | None = None,
    metadata_path: str | Path | None = None,
) -> pd.DataFrame:
    """Predict exactly 24 hours recursively from a timestamped history.

    Observations after the origin are discarded before inference. Missing AQI
    and hourly gaps are retained; the shared inference builder rejects them
    whenever they affect required lag or rolling features.
    """
    history, origin = validate_history(history, forecast_start)
    if predictor is None:
        predictor = OneHourAQIPredictor(model_path)
    if metadata_path is None:
        selected_model_path = Path(model_path) if model_path else DEFAULT_MODEL_DIR / "aqi_xgboost.json"
        metadata_path = selected_model_path.with_name("aqi_xgboost_metadata.json")
    minimum = required_history_positions(metadata_path)

    # A gap among the positions needed by the model remains NaN after reindexing
    # in build_inference_features and is rejected rather than imputed.
    first_required = origin - pd.Timedelta(hours=minimum - 1)
    indexed = history.set_index("timestamp").reindex(
        pd.date_range(first_required, origin, freq="h")
    )
    if len(indexed) < minimum or indexed.AQI.isna().any():
        raise ValueError(f"history must contain {minimum} consecutive observed hourly positions through forecast_start")

    synthetic = history.copy()
    records = []
    current_time = origin
    for horizon in range(1, 25):
        prediction = float(predictor.predict(synthetic))
        if not np.isfinite(prediction):
            raise ValueError("predictor returned a non-finite AQI prediction")
        prediction = float(np.clip(prediction, 0.0, 500.0))
        current_time += pd.Timedelta(hours=1)
        records.append({
            "forecast_start": origin,
            "timestamp": current_time,
            "horizon": horizon,
            "predicted_AQI": prediction,
        })
        synthetic.loc[len(synthetic)] = [current_time, prediction]
    return pd.DataFrame(records, columns=FORECAST_COLUMNS)
