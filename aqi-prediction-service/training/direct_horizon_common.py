"""Leakage-safe targets and chronological split utilities for direct AQI models."""
from __future__ import annotations
from pathlib import Path
import hashlib
import numpy as np
import pandas as pd
from aqi_prediction_service.feature_engineering import FEATURE_NAMES, create_feature_frame
TRAIN_CUTOFF = pd.Timestamp("2023-01-01 00:00:00")
VALIDATION_END = pd.Timestamp("2023-10-01 00:00:00")
HORIZONS = tuple(range(1, 25))
def validate_hourly(data: pd.DataFrame) -> pd.DataFrame:
    if not {"timestamp", "AQI"}.issubset(data.columns): raise ValueError("data must contain timestamp and AQI")
    f=data[["timestamp","AQI"]].copy(); f["timestamp"]=pd.to_datetime(f.timestamp,errors="raise")
    if f.empty or f.timestamp.isna().any(): raise ValueError("data must contain valid timestamps")
    if f.timestamp.duplicated().any(): raise ValueError("timestamps must be unique")
    if not f.timestamp.is_monotonic_increasing: raise ValueError("timestamps must be sorted in ascending order")
    if not pd.api.types.is_numeric_dtype(f.AQI): raise ValueError("AQI must be numeric")
    v=f.AQI.dropna().to_numpy(dtype=float)
    if not np.isfinite(v).all() or ((v<0)|(v>500)).any(): raise ValueError("observed AQI values must be finite and in [0, 500]")
    if len(f)>1 and not f.timestamp.diff().iloc[1:].eq(pd.Timedelta(hours=1)).all(): raise ValueError("timestamps must form a continuous hourly grid; do not interpolate gaps")
    return f.reset_index(drop=True)
def build_horizon_frame(data: pd.DataFrame, horizon: int) -> pd.DataFrame:
    if horizon not in HORIZONS: raise ValueError("horizon must be in 1..24")
    hourly=validate_hourly(data); f=create_feature_frame(hourly,include_target=False)
    target_times=f.timestamp+pd.Timedelta(hours=horizon); f["target_timestamp"]=target_times
    f["target_AQI"]=hourly.set_index("timestamp").AQI.reindex(pd.DatetimeIndex(target_times)).to_numpy(dtype=float)
    f["horizon"]=horizon
    f["features_valid"]=np.isfinite(f[FEATURE_NAMES].to_numpy(dtype=float)).all(axis=1)
    f["label_valid"]=f.target_AQI.notna()
    return f
def split_horizon_frame(frame: pd.DataFrame) -> dict[str,pd.DataFrame]:
    train=frame.loc[(frame.timestamp<TRAIN_CUTOFF)&(frame.target_timestamp<TRAIN_CUTOFF)&frame.features_valid&frame.label_valid].copy()
    val=frame.loc[(frame.timestamp>=TRAIN_CUTOFF)&(frame.target_timestamp<VALIDATION_END)&frame.features_valid&frame.label_valid].copy()
    test=frame.loc[(frame.timestamp>=VALIDATION_END)&frame.features_valid&frame.label_valid].copy()
    assert (train.target_timestamp<TRAIN_CUTOFF).all() and (val.target_timestamp<VALIDATION_END).all()
    return {"train":train,"validation":val,"test":test}
def data_fingerprint(path: str|Path)->str:
    digest=hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda:handle.read(1024*1024),b""): digest.update(chunk)
    return digest.hexdigest()
