"""Tests for the isolated experimental hybrid forecaster."""
from __future__ import annotations
import json,sys,tempfile,unittest
from pathlib import Path
import numpy as np
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"src")); sys.path.insert(0,str(ROOT/"training"))
from aqi_prediction_service.direct_inference import HORIZONS,FORECAST_COLUMNS
from aqi_prediction_service.feature_engineering import build_inference_features
from aqi_prediction_service.hybrid_forecast import HybridAQIForecaster
from evaluate_hybrid_24h import _forecast_period
from aqi_prediction_service.recursive_forecast import forecast_24h
META=ROOT/"saved_models"/"aqi_xgboost_metadata.json"

def sample_history(n=169):
    end=pd.Timestamp("2024-02-01 12:00")
    return pd.DataFrame({"timestamp":pd.date_range(end=end,periods=n,freq="h"),"AQI":np.linspace(70,180,n)})
class IncrementPredictor:
    def predict(self,history): return float(build_inference_features(history).iloc[0].current_aqi+1)
class FakeDirect:
    def forecast(self,history,origin):
        # This fake follows the direct contract: independent outputs from the origin snapshot.
        current=float(build_inference_features(history.loc[history.timestamp<=origin]).iloc[0].current_aqi)
        return pd.DataFrame({"forecast_start":origin,"timestamp":pd.date_range(origin+pd.Timedelta(hours=1),periods=24,freq="h"),"horizon":HORIZONS,"predicted_AQI":np.arange(300,324,dtype=float)+current/100})
class BrokenDirect:
    def forecast(self,history,origin): raise RuntimeError("simulated direct inference failure")

class HybridForecastTests(unittest.TestCase):
    def setUp(self):
        self.history=sample_history(); self.origin=self.history.timestamp.iloc[-1]
        self.mapping={h:("direct" if h%2 else "recursive") for h in HORIZONS}
        self.hybrid=HybridAQIForecaster(self.mapping,recursive_predictor=IncrementPredictor(),direct_forecaster=FakeDirect())
    def test_exact_24_predictions_timestamps_and_horizon_mapping(self):
        out=self.hybrid.forecast(self.history,self.origin)
        self.assertEqual(list(out.columns),FORECAST_COLUMNS)
        self.assertEqual(len(out),24); self.assertEqual(out.horizon.tolist(),list(HORIZONS))
        self.assertEqual(out.timestamp.tolist(),list(pd.date_range(self.origin+pd.Timedelta(hours=1),periods=24,freq="h")))
        rec=forecast_24h(self.history,self.origin,IncrementPredictor(),metadata_path=META)
        direct=FakeDirect().forecast(self.history,self.origin)
        for h in HORIZONS:
            expected=direct.loc[direct.horizon==h,"predicted_AQI"].iloc[0] if h%2 else rec.loc[rec.horizon==h,"predicted_AQI"].iloc[0]
            self.assertAlmostEqual(out.loc[out.horizon==h,"predicted_AQI"].iloc[0],expected)
    def test_future_actuals_do_not_change_either_component_or_hybrid(self):
        future=pd.DataFrame({"timestamp":pd.date_range(self.origin+pd.Timedelta(hours=1),periods=30,freq="h"),"AQI":np.full(30,499.)})
        extended=pd.concat([self.history,future],ignore_index=True)
        original=self.hybrid.forecast(self.history,self.origin)
        with_future=self.hybrid.forecast(extended,self.origin)
        pd.testing.assert_frame_equal(original,with_future)
    def test_missing_history_and_inference_failures_propagate(self):
        gap=self.history.drop(index=80)
        with self.assertRaisesRegex(ValueError,"169 consecutive"):
            self.hybrid.forecast(gap,self.origin)
        broken=HybridAQIForecaster(self.mapping,recursive_predictor=IncrementPredictor(),direct_forecaster=BrokenDirect())
        with self.assertRaisesRegex(RuntimeError,"simulated direct inference failure"):
            broken.forecast(self.history,self.origin)
    def test_evaluation_pairs_share_targets_across_all_four_methods(self):
        ts=pd.date_range("2023-10-01",periods=300,freq="h")
        data=pd.DataFrame({"timestamp":ts,"AQI":100+np.arange(300,dtype=float)/10})
        origin=ts[200]; mapping={h:"direct" if h%2 else "recursive" for h in HORIZONS}
        direct=FakeDirect(); recursive=IncrementPredictor()
        ledger,skipped,failures=_forecast_period(data,direct,recursive,[origin],selection=mapping)
        self.assertFalse(skipped); self.assertFalse(failures); self.assertEqual(len(ledger),24)
        self.assertTrue(ledger.common_valid.all())
        self.assertTrue((ledger.target_timestamp==ledger.origin_timestamp+pd.to_timedelta(ledger.lead_hour,unit="h")).all())
        self.assertTrue((ledger.persistence_AQI==ledger.origin_AQI).all())
        self.assertTrue(ledger[["actual_AQI","direct_AQI","recursive_AQI","hybrid_AQI","persistence_AQI"]].notna().all().all())
    def test_selection_mapping_must_cover_all_leads_and_valid_methods(self):
        with self.assertRaisesRegex(ValueError,"exactly leads"):
            HybridAQIForecaster({1:"direct"},recursive_predictor=IncrementPredictor(),direct_forecaster=FakeDirect())
        invalid=dict(self.mapping); invalid[24]="persistence"
        with self.assertRaisesRegex(ValueError,"direct.*recursive"):
            HybridAQIForecaster(invalid,recursive_predictor=IncrementPredictor(),direct_forecaster=FakeDirect())
    def test_selection_config_round_trip(self):
        config={"selection_policy":"per_horizon_validation_mae","selection_by_horizon":{str(k):v for k,v in self.mapping.items()}}
        with tempfile.TemporaryDirectory(dir=ROOT) as temp:
            path=Path(temp)/"selection.json"; path.write_text(json.dumps(config),encoding="utf-8")
            restored=HybridAQIForecaster.from_config(path,recursive_predictor=IncrementPredictor(),direct_forecaster=FakeDirect())
            self.assertEqual(restored.selection_by_horizon,self.mapping)
    def test_deterministic_output(self):
        first=self.hybrid.forecast(self.history,self.origin); second=self.hybrid.forecast(self.history,self.origin)
        pd.testing.assert_frame_equal(first,second)
    def test_rejects_component_timestamp_or_horizon_mismatch(self):
        direct=FakeDirect(); frame=direct.forecast(self.history,self.origin); frame.loc[0,"horizon"]=2
        with self.assertRaisesRegex(ValueError,"exactly leads"):
            self.hybrid.combine(frame,forecast_24h(self.history,self.origin,IncrementPredictor(),metadata_path=META),self.origin)

if __name__=="__main__":unittest.main()


