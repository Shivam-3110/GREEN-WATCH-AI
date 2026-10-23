"""Shared feature definitions for one-hour Lucknow AQI training and inference."""
from __future__ import annotations

import numpy as np
import pandas as pd

LAGS = [1, 2, 3, 4, 5, 6, 12, 24, 48, 72, 168]
FEATURE_NAMES = [
    *(f"lag_{lag}" for lag in LAGS),
    "rolling_mean_3",
    "rolling_mean_6",
    "rolling_mean_24",
    "rolling_std_6",
    "rolling_max_24",
    "rolling_min_24",
    "current_aqi",
    "hour",
    "day_of_week",
    "month",
    "day_of_year",
]


def create_feature_frame(observations: pd.DataFrame, include_target: bool = True) -> pd.DataFrame:
    """Create features at time t from AQI through t, optionally target AQI(t+1).

    Input timestamps must already describe the full hourly timeline. Missing AQI
    remains missing and propagates into required lags/windows; no imputation is
    performed here.
    """
    if not {"timestamp", "AQI"}.issubset(observations.columns):
        raise ValueError("observations must contain timestamp and AQI columns")
    frame = observations[["timestamp", "AQI"]].copy()
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="raise")
    if frame["timestamp"].isna().any() or frame["timestamp"].duplicated().any():
        raise ValueError("timestamps must be present and unique")
    frame = frame.sort_values("timestamp").reset_index(drop=True)
    if len(frame) > 1 and not frame.timestamp.diff().iloc[1:].eq(pd.Timedelta(hours=1)).all():
        raise ValueError("observations must use a continuous hourly timeline")

    for lag in LAGS:
        frame[f"lag_{lag}"] = frame["AQI"].shift(lag)
    past_aqi = frame["AQI"].shift(1)
    for window in (3, 6, 24):
        frame[f"rolling_mean_{window}"] = past_aqi.rolling(window, min_periods=window).mean()
    frame["rolling_std_6"] = past_aqi.rolling(6, min_periods=6).std()
    frame["rolling_max_24"] = past_aqi.rolling(24, min_periods=24).max()
    frame["rolling_min_24"] = past_aqi.rolling(24, min_periods=24).min()
    frame["current_aqi"] = frame["AQI"]
    frame["hour"] = frame.timestamp.dt.hour
    frame["day_of_week"] = frame.timestamp.dt.dayofweek
    frame["month"] = frame.timestamp.dt.month
    frame["day_of_year"] = frame.timestamp.dt.dayofyear

    if include_target:
        frame["target"] = frame["AQI"].shift(-1)
        frame["next_hour_is_observed"] = (
            frame.timestamp.shift(-1) - frame.timestamp == pd.Timedelta(hours=1)
        )
    return frame


def build_inference_features(history: pd.DataFrame) -> pd.DataFrame:
    """Build one ordered feature row from recent timestamped AQI history."""
    if not {"timestamp", "AQI"}.issubset(history.columns):
        raise ValueError("history must contain timestamp and AQI columns")
    frame = history[["timestamp", "AQI"]].copy()
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="raise")
    if frame.empty or frame.timestamp.isna().any():
        raise ValueError("history must contain timestamped AQI observations")
    if frame.timestamp.duplicated().any():
        raise ValueError("history must not contain duplicate timestamps")
    if not pd.api.types.is_numeric_dtype(frame.AQI):
        raise ValueError("AQI observations must be numeric")
    frame = frame.sort_values("timestamp").set_index("timestamp")
    if len(frame) < 169:
        raise ValueError("at least 169 hourly positions of history are required")

    latest = frame.index[-1]
    hourly_index = pd.date_range(frame.index[0], latest, freq="h")
    if len(hourly_index) < 169:
        raise ValueError("history must span at least 168 hours")
    frame = frame.reindex(hourly_index).tail(169).rename_axis("timestamp").reset_index()
    features = create_feature_frame(frame, include_target=False).tail(1)[FEATURE_NAMES]
    values = features.to_numpy(dtype=float)
    if not np.isfinite(values).all():
        raise ValueError("history is missing a required lag or rolling-window AQI value")
    if ((values[:, :18] < 0) | (values[:, :18] > 500)).any():
        raise ValueError("required AQI history values must be between 0 and 500")
    return features
