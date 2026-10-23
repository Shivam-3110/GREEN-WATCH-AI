import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from aqi_prediction_service.feature_engineering import FEATURE_NAMES, build_inference_features
from aqi_prediction_service.recursive_forecast import forecast_24h

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / "saved_models" / "aqi_xgboost_metadata.json"


class RecordingPredictor:
    def __init__(self, fail=False):
        self.histories = []
        self.fail = fail

    def predict(self, history):
        if self.fail:
            raise RuntimeError("simulated model failure")
        self.histories.append(history.copy())
        features = build_inference_features(history)
        return float(features.iloc[0]["current_aqi"] + 1)


class RecursiveForecastTests(unittest.TestCase):
    def setUp(self):
        self.start = pd.Timestamp("2024-03-01 00:00:00")
        self.history = pd.DataFrame({
            "timestamp": pd.date_range(end=self.start, periods=169, freq="h"),
            "AQI": np.arange(100, 269, dtype=float),
        })

    def test_exact_order_and_feature_parity(self):
        features = build_inference_features(self.history)
        self.assertEqual(list(features.columns), [
            "lag_1", "lag_2", "lag_3", "lag_4", "lag_5", "lag_6", "lag_12", "lag_24",
            "lag_48", "lag_72", "lag_168", "rolling_mean_3", "rolling_mean_6", "rolling_mean_24",
            "rolling_std_6", "rolling_max_24", "rolling_min_24", "current_aqi", "hour",
            "day_of_week", "month", "day_of_year",
        ])
        self.assertEqual(list(features.columns), FEATURE_NAMES)
        self.assertEqual(features.iloc[0]["lag_1"], 267)
        self.assertEqual(features.iloc[0]["lag_168"], 100)
        self.assertEqual(features.iloc[0]["rolling_mean_3"], np.mean([265, 266, 267]))
        self.assertEqual(features.iloc[0]["rolling_mean_6"], np.mean(np.arange(262, 268)))
        self.assertAlmostEqual(features.iloc[0]["rolling_std_6"], np.std(np.arange(262, 268), ddof=1))
        self.assertEqual(features.iloc[0]["rolling_max_24"], 267)
        self.assertEqual(features.iloc[0]["rolling_min_24"], 244)
        self.assertEqual(features.iloc[0]["current_aqi"], 268)

    def test_returns_24_hourly_predictions_and_recurses(self):
        predictor = RecordingPredictor()
        result = forecast_24h(self.history, self.start, predictor, metadata_path=META)
        self.assertEqual(list(result.columns), ["forecast_start", "timestamp", "horizon", "predicted_AQI"])
        self.assertEqual(len(result), 24)
        self.assertEqual(result.horizon.tolist(), list(range(1, 25)))
        self.assertEqual(result.timestamp.tolist(), list(pd.date_range(self.start + pd.Timedelta(hours=1), periods=24, freq="h")))
        self.assertEqual(result.forecast_start.nunique(), 1)
        self.assertEqual(result.predicted_AQI.tolist(), list(np.arange(269, 293, dtype=float)))
        self.assertEqual(len(predictor.histories), 24)
        self.assertEqual(len(predictor.histories[1]), 170)
        self.assertEqual(predictor.histories[1].iloc[-1].AQI, result.iloc[0].predicted_AQI)
        self.assertEqual(list(build_inference_features(predictor.histories[0]).columns), FEATURE_NAMES)

    def test_future_actuals_do_not_change_forecast(self):
        future = pd.DataFrame({
            "timestamp": pd.date_range(self.start + pd.Timedelta(hours=1), periods=30, freq="h"),
            "AQI": np.full(30, 900.0),
        })
        first = forecast_24h(self.history, self.start, RecordingPredictor(), metadata_path=META)
        second = forecast_24h(pd.concat([self.history, future], ignore_index=True), self.start,
                              RecordingPredictor(), metadata_path=META)
        pd.testing.assert_frame_equal(first, second)

    def test_rejects_short_history_missing_hour_duplicate_and_unsorted_input(self):
        with self.assertRaisesRegex(ValueError, "169"):
            forecast_24h(self.history.tail(168), self.start, RecordingPredictor(), metadata_path=META)
        gap = self.history.drop(index=100)
        with self.assertRaisesRegex(ValueError, "consecutive observed hourly"):
            forecast_24h(gap, self.start, RecordingPredictor(), metadata_path=META)
        duplicate = pd.concat([self.history, self.history.tail(1)], ignore_index=True)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            forecast_24h(duplicate, self.start, RecordingPredictor(), metadata_path=META)
        unsorted = self.history.iloc[::-1].reset_index(drop=True)
        with self.assertRaisesRegex(ValueError, "sorted"):
            forecast_24h(unsorted, self.start, RecordingPredictor(), metadata_path=META)

    def test_rejects_invalid_origin_and_unobserved_origin(self):
        with self.assertRaisesRegex(ValueError, "observed AQI"):
            forecast_24h(self.history, self.start + pd.Timedelta(hours=1), RecordingPredictor(), metadata_path=META)
        with self.assertRaisesRegex(ValueError, "exact hourly"):
            forecast_24h(self.history, self.start + pd.Timedelta(minutes=30), RecordingPredictor(), metadata_path=META)

    def test_model_loading_and_prediction_errors_are_reported(self):
        with self.assertRaises(FileNotFoundError):
            forecast_24h(self.history, self.start, model_path=ROOT / "missing-model.json")
        with self.assertRaisesRegex(RuntimeError, "simulated model failure"):
            forecast_24h(self.history, self.start, RecordingPredictor(fail=True), metadata_path=META)


if __name__ == "__main__":
    unittest.main()
