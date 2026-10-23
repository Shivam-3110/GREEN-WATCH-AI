"""Tests for direct horizon target construction, inference and evaluation."""
from __future__ import annotations
import sys, unittest
from pathlib import Path
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"src")); sys.path.insert(0,str(ROOT/"training"))
from aqi_prediction_service.feature_engineering import FEATURE_NAMES, build_inference_features
from aqi_prediction_service.direct_inference import DirectAQIForecaster
from aqi_prediction_service.recursive_forecast import forecast_24h
from direct_horizon_common import HORIZONS, TRAIN_CUTOFF, VALIDATION_END, build_horizon_frame, split_horizon_frame, validate_hourly
from evaluate_direct_24h import evaluate

class _Direct:
    def predict(self, history):
        value=float(build_inference_features(history).iloc[0].current_aqi)
        return np.full(24,value,dtype=float)
class _Recursive:
    def predict(self, history):
        return float(build_inference_features(history).iloc[0].current_aqi)

def make_hourly(n=600,start="2022-12-20 00:00:00"):
    ts=pd.date_range(start,periods=n,freq="h")
    vals=100+20*np.sin(np.arange(n)/8)+np.arange(n)*.01
    return pd.DataFrame({"timestamp":ts,"AQI":vals})

class DirectHorizonTests(unittest.TestCase):
    def test_exact_canonical_feature_schema_and_shared_builder_parity(self):
        data=make_hourly(180)
        trained=build_horizon_frame(data,1).iloc[169]
        inferred=build_inference_features(data.iloc[:170])
        self.assertEqual(len(FEATURE_NAMES),22)
        self.assertEqual(list(inferred.columns),FEATURE_NAMES)
        np.testing.assert_allclose(inferred.iloc[0].to_numpy(dtype=float),trained[FEATURE_NAMES].to_numpy(dtype=float))
    def test_exact_target_alignment_for_every_horizon(self):
        data=make_hourly(400)
        for h in HORIZONS:
            f=build_horizon_frame(data,h)
            i=200
            self.assertEqual(f.iloc[i].target_timestamp,data.iloc[i].timestamp+pd.Timedelta(hours=h))
            self.assertAlmostEqual(f.iloc[i].target_AQI,float(data.iloc[i+h].AQI))
    def test_future_actuals_never_change_origin_features(self):
        data=make_hourly(240)
        changed=data.copy(); changed.loc[changed.timestamp>data.timestamp.iloc[180],"AQI"]+=100
        a=build_horizon_frame(data,24); b=build_horizon_frame(changed,24)
        np.testing.assert_allclose(a.loc[180,FEATURE_NAMES],b.loc[180,FEATURE_NAMES])
        self.assertNotEqual(a.loc[180,"target_AQI"],b.loc[180,"target_AQI"])
    def test_chronological_horizon_aware_purging(self):
        data=make_hourly(30000,start="2020-01-01")
        for h in (1,6,24):
            s=split_horizon_frame(build_horizon_frame(data,h))
            self.assertTrue((s["train"].target_timestamp<TRAIN_CUTOFF).all())
            self.assertTrue((s["validation"].timestamp>=TRAIN_CUTOFF).all())
            self.assertTrue((s["validation"].target_timestamp<VALIDATION_END).all())
    def test_missing_values_preserved_no_interpolation_and_grid_validation(self):
        data=make_hourly(180); data.loc[170,"AQI"]=np.nan
        f=build_horizon_frame(data,1)
        self.assertTrue(np.isnan(f.loc[169,"target_AQI"]))
        self.assertFalse(f.loc[170,"features_valid"])
        self.assertFalse(f.loc[171,"features_valid"])
        gap=data.drop(index=50)
        with self.assertRaisesRegex(ValueError,"continuous hourly"):
            validate_hourly(gap)
    def test_duplicate_and_unsorted_timestamps_rejected(self):
        data=make_hourly(180)
        with self.assertRaisesRegex(ValueError,"unique"):
            validate_hourly(pd.concat([data,data.tail(1)],ignore_index=True))
        with self.assertRaisesRegex(ValueError,"sorted"):
            validate_hourly(data.iloc[::-1].reset_index(drop=True))
    def test_inference_prediction_shape_finiteness_and_missing_history(self):
        f=DirectAQIForecaster.__new__(DirectAQIForecaster)
        class Model:
            def predict(self,features): return np.array([float(features.iloc[0].current_aqi)])
        f.models={h:Model() for h in HORIZONS}
        pred=f.predict(make_hourly(169))
        self.assertEqual(pred.shape,(24,)); self.assertTrue(np.isfinite(pred).all())
        with self.assertRaisesRegex(ValueError,"169"):
            f.predict(make_hourly(168))
        gap=make_hourly(170).drop(index=168)
        with self.assertRaisesRegex(ValueError,"169 consecutive"):
            f.predict(gap)
    def test_timestamped_forecast_returns_24_leads_and_ignores_future_rows(self):
        forecaster=DirectAQIForecaster.__new__(DirectAQIForecaster)
        class Model:
            def predict(self,features): return np.array([float(features.iloc[0].current_aqi)])
        forecaster.models={h:Model() for h in HORIZONS}
        history=make_hourly(169)
        origin=history.timestamp.iloc[-1]
        future=pd.DataFrame({"timestamp":pd.date_range(origin+pd.Timedelta(hours=1),periods=30,freq="h"),"AQI":np.full(30,499.)})
        result=forecaster.forecast(pd.concat([history,future],ignore_index=True),origin)
        self.assertEqual(len(result),24)
        self.assertEqual(result.horizon.tolist(),list(HORIZONS))
        self.assertEqual(result.timestamp.tolist(),list(pd.date_range(origin+pd.Timedelta(hours=1),periods=24,freq="h")))
        self.assertTrue((result.predicted_AQI==history.AQI.iloc[-1]).all())
    def test_model_loading_and_metadata_consistency(self):
        model_dir=ROOT/"saved_models"/"direct_horizons"
        self.assertTrue(model_dir.is_dir(),"Train direct models before running the complete suite")
        forecaster=DirectAQIForecaster(model_dir)
        self.assertEqual(set(forecaster.models),set(HORIZONS))
        for h in HORIZONS:
            meta=forecaster.metadata[h]
            self.assertEqual(meta["horizon_hours"],h)
            self.assertEqual(meta["feature_names"],FEATURE_NAMES)
            self.assertEqual(forecaster.models[h].get_booster().feature_names,FEATURE_NAMES)
    def test_missing_model_fails_loading(self):
        with self.assertRaises(FileNotFoundError): DirectAQIForecaster(ROOT/"saved_models"/"missing_direct_models")
    def test_model_prediction_error_is_reported(self):
        f=DirectAQIForecaster.__new__(DirectAQIForecaster)
        class BrokenModel:
            def predict(self,features): raise RuntimeError("simulated direct model failure")
        f.models={h:BrokenModel() for h in HORIZONS}
        with self.assertRaisesRegex(RuntimeError,"simulated direct model failure"):
            f.predict(make_hourly(169))
    def test_comparable_recursive_persistence_pairs(self):
        data=make_hourly(300,start="2023-10-01 00:00")
        origin=data.timestamp.iloc[200]
        ledger,metrics,*_=evaluate(data,_Direct(),_Recursive(),start=origin,end=origin)
        self.assertEqual(len(ledger),24)
        self.assertTrue(ledger.common_valid.all())
        self.assertEqual(metrics.valid_pairs.tolist(),[1]*24)
        self.assertTrue((ledger.persistence_AQI==ledger.origin_AQI).all())
        self.assertTrue((ledger.target_timestamp==ledger.origin_timestamp+pd.to_timedelta(ledger.lead_hour,unit="h")).all())
    def test_model_training_reproducible_with_fixed_seed(self):
        rng=np.random.default_rng(123); x=pd.DataFrame(rng.normal(size=(120,3)),columns=["a","b","c"]); y=x.a*2-x.b
        def fit():
            m=XGBRegressor(n_estimators=20,max_depth=2,learning_rate=.1,random_state=42,n_jobs=1,tree_method="hist",objective="reg:squarederror")
            m.fit(x,y,verbose=False); return m.predict(x)
        np.testing.assert_array_equal(fit(),fit())

if __name__=="__main__": unittest.main()









