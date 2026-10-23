"""Inference for independently trained direct AQI lead-hour models."""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from aqi_prediction_service.feature_engineering import FEATURE_NAMES, build_inference_features
ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_DIR = ROOT / "saved_models" / "direct_horizons"
HORIZONS = tuple(range(1, 25))
FORECAST_COLUMNS = ["forecast_start", "timestamp", "horizon", "predicted_AQI"]
def validate_direct_history(history: pd.DataFrame) -> pd.DataFrame:
    """Enforce the recursive pipeline's strict 169 consecutive observed readings."""
    if not {"timestamp", "AQI"}.issubset(history.columns):
        raise ValueError("history must contain timestamp and AQI columns")
    frame=history[["timestamp","AQI"]].copy()
    frame["timestamp"]=pd.to_datetime(frame.timestamp,errors="raise")
    if frame.empty or frame.timestamp.isna().any(): raise ValueError("history must contain valid timestamps")
    if frame.timestamp.duplicated().any(): raise ValueError("history timestamps must be unique")
    if not frame.timestamp.is_monotonic_increasing: raise ValueError("history timestamps must be sorted")
    if not pd.api.types.is_numeric_dtype(frame.AQI): raise ValueError("AQI history must be numeric")
    if len(frame)<169: raise ValueError("history must contain 169 consecutive observed hourly positions")
    latest=frame.timestamp.iloc[-1]
    expected=pd.date_range(end=latest,periods=169,freq="h")
    recent=frame.set_index("timestamp").reindex(expected).rename_axis("timestamp").reset_index()
    if recent.AQI.isna().any(): raise ValueError("history must contain 169 consecutive observed hourly positions")
    return recent
class DirectAQIForecaster:
    """Loads and scores the 24 direct models from one origin-time feature row."""
    def __init__(self, model_dir: str | Path | None = None):
        self.model_dir = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self.models, self.metadata = {}, {}
        for horizon in HORIZONS:
            stem = f"direct_aqi_h{horizon:02d}"
            model_path, meta_path = self.model_dir / f"{stem}.json", self.model_dir / f"{stem}_metadata.json"
            if not model_path.is_file(): raise FileNotFoundError(f"Direct model for lead {horizon} not found: {model_path}")
            if not meta_path.is_file(): raise FileNotFoundError(f"Direct model metadata for lead {horizon} not found: {meta_path}")
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            if meta.get("horizon_hours") != horizon or meta.get("feature_names") != FEATURE_NAMES:
                raise ValueError(f"Lead {horizon} metadata does not match canonical feature contract")
            model = XGBRegressor()
            model.load_model(model_path)
            names = model.get_booster().feature_names
            if names is not None and names != FEATURE_NAMES: raise ValueError(f"Lead {horizon} model feature order mismatch")
            self.models[horizon], self.metadata[horizon] = model, meta
    def predict(self, history: pd.DataFrame) -> np.ndarray:
        features = build_inference_features(validate_direct_history(history))
        if list(features.columns) != FEATURE_NAMES: raise ValueError("Inference feature order differs from canonical schema")
        values = np.asarray([float(self.models[h].predict(features)[0]) for h in HORIZONS], dtype=float)
        if values.shape != (24,) or not np.isfinite(values).all(): raise ValueError("Expected 24 finite predictions")
        return np.clip(values, 0.0, 500.0)
    def forecast(self, history: pd.DataFrame, forecast_start: str | pd.Timestamp) -> pd.DataFrame:
        """Return 24 timestamped forecasts, ignoring any history after the origin."""
        if not {"timestamp", "AQI"}.issubset(history.columns):
            raise ValueError("history must contain timestamp and AQI columns")
        frame=history[["timestamp","AQI"]].copy()
        frame["timestamp"]=pd.to_datetime(frame.timestamp,errors="raise")
        origin=pd.Timestamp(forecast_start)
        if pd.isna(origin) or origin.minute or origin.second or origin.microsecond or origin.nanosecond:
            raise ValueError("forecast_start must be an exact hourly timestamp")
        if frame.timestamp.duplicated().any(): raise ValueError("history timestamps must be unique")
        if not frame.timestamp.is_monotonic_increasing: raise ValueError("history timestamps must be sorted")
        frame=frame.loc[frame.timestamp<=origin].copy()
        if frame.empty or frame.timestamp.iloc[-1]!=origin or pd.isna(frame.AQI.iloc[-1]):
            raise ValueError("history must contain an observed AQI at forecast_start")
        predictions=self.predict(frame)
        return pd.DataFrame({"forecast_start":origin,"timestamp":pd.date_range(origin+pd.Timedelta(hours=1),periods=24,freq="h"),"horizon":HORIZONS,"predicted_AQI":predictions},columns=FORECAST_COLUMNS)




