"""Experimental per-lead selector that combines direct and recursive AQI forecasts."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Mapping
import numpy as np
import pandas as pd
from aqi_prediction_service.direct_inference import DirectAQIForecaster, HORIZONS, FORECAST_COLUMNS
from aqi_prediction_service.one_hour_inference import OneHourAQIPredictor
from aqi_prediction_service.recursive_forecast import forecast_24h
ROOT=Path(__file__).resolve().parents[2]

class HybridAQIForecaster:
    """Select direct or recursive output independently for each lead hour."""
    def __init__(self, selection_by_horizon: Mapping[int|str,str], *, recursive_predictor=None, direct_forecaster=None):
        mapping={int(k):str(v).lower() for k,v in selection_by_horizon.items()}
        if set(mapping)!=set(HORIZONS): raise ValueError("selection_by_horizon must define exactly leads 1 through 24")
        if any(value not in {"direct","recursive"} for value in mapping.values()): raise ValueError("each horizon selection must be 'direct' or 'recursive'")
        self.selection_by_horizon=mapping
        self.recursive_predictor=recursive_predictor or OneHourAQIPredictor()
        self.direct_forecaster=direct_forecaster or DirectAQIForecaster()

    @classmethod
    def from_config(cls,path:str|Path,**kwargs):
        config=json.loads(Path(path).read_text(encoding="utf-8"))
        if config.get("selection_policy")!="per_horizon_validation_mae": raise ValueError("Unsupported hybrid selection policy")
        return cls(config.get("selection_by_horizon",{}),**kwargs)

    def combine(self,direct:pd.DataFrame,recursive:pd.DataFrame,forecast_start:str|pd.Timestamp)->pd.DataFrame:
        origin=pd.Timestamp(forecast_start); expected=pd.date_range(origin+pd.Timedelta(hours=1),periods=24,freq="h")
        for name,frame in (("recursive",recursive),("direct",direct)):
            if len(frame)!=24 or frame.horizon.tolist()!=list(HORIZONS): raise ValueError(f"{name} forecast must contain exactly leads 1 through 24")
            if not pd.DatetimeIndex(frame.timestamp).equals(expected): raise ValueError(f"{name} forecast timestamps do not match origin + horizon")
            if not np.isfinite(frame.predicted_AQI.to_numpy(dtype=float)).all(): raise ValueError(f"{name} forecast contains non-finite AQI")
        rec=recursive.set_index("horizon").predicted_AQI; direct_values=direct.set_index("horizon").predicted_AQI
        selected=np.asarray([direct_values[h] if self.selection_by_horizon[h]=="direct" else rec[h] for h in HORIZONS],dtype=float)
        if not np.isfinite(selected).all(): raise ValueError("hybrid forecast contains non-finite AQI")
        return pd.DataFrame({"forecast_start":origin,"timestamp":expected,"horizon":HORIZONS,"predicted_AQI":selected},columns=FORECAST_COLUMNS)

    def forecast(self,history:pd.DataFrame,forecast_start:str|pd.Timestamp)->pd.DataFrame:
        """Produce 24 ordered predictions; components receive origin-safe history."""
        origin=pd.Timestamp(forecast_start)
        recursive=forecast_24h(history,origin,self.recursive_predictor)
        direct=self.direct_forecaster.forecast(history,origin)
        return self.combine(direct,recursive,origin)
