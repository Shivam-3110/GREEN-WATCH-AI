import unittest

import numpy as np
import pandas as pd

from aqi_prediction_service.feature_engineering import (
    FEATURE_NAMES,
    build_inference_features,
    create_feature_frame,
)
from aqi_prediction_service.one_hour_inference import OneHourAQIPredictor


class FeatureEngineeringTests(unittest.TestCase):
    def setUp(self):
        self.history = pd.DataFrame({
            "timestamp": pd.date_range("2024-01-01", periods=169, freq="h"),
            "AQI": np.linspace(20, 188, 169),
        })

    def test_training_and_inference_preprocessing_match(self):
        trained = create_feature_frame(self.history, include_target=False).tail(1)[FEATURE_NAMES]
        inferred = build_inference_features(self.history)
        self.assertEqual(list(inferred.columns), FEATURE_NAMES)
        np.testing.assert_allclose(inferred.to_numpy(), trained.to_numpy(), rtol=0, atol=1e-12)
        self.assertAlmostEqual(inferred.iloc[0]["current_aqi"], self.history.AQI.iloc[-1])
        self.assertAlmostEqual(inferred.iloc[0]["lag_1"], self.history.AQI.iloc[-2])
        self.assertAlmostEqual(inferred.iloc[0]["lag_168"], self.history.AQI.iloc[0])

    def test_allows_unneeded_old_gap_but_rejects_required_recent_gap(self):
        extra = pd.DataFrame({"timestamp": [self.history.timestamp.iloc[0] - pd.Timedelta(hours=1)], "AQI": [10.0]})
        older_gap = pd.concat([extra, self.history], ignore_index=True).drop(index=101)
        self.assertEqual(build_inference_features(older_gap).shape, (1, len(FEATURE_NAMES)))
        recent_gap = pd.concat([extra, self.history], ignore_index=True).drop(index=166)
        with self.assertRaisesRegex(ValueError, "missing a required"):
            build_inference_features(recent_gap)

    def test_rejects_short_non_numeric_and_out_of_range_history(self):
        with self.assertRaisesRegex(ValueError, "169"):
            build_inference_features(self.history.tail(168))
        invalid = self.history.astype({"AQI": "object"})
        invalid.loc[168, "AQI"] = "bad"
        with self.assertRaisesRegex(ValueError, "numeric"):
            build_inference_features(invalid)
        invalid = self.history.copy()
        invalid.loc[168, "AQI"] = 501
        with self.assertRaisesRegex(ValueError, "between 0 and 500"):
            build_inference_features(invalid)

    def test_rejects_duplicate_timestamps(self):
        invalid = pd.concat([self.history, self.history.tail(1)], ignore_index=True)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            build_inference_features(invalid)

    def test_rejects_missing_input_columns(self):
        with self.assertRaisesRegex(ValueError, "timestamp and AQI"):
            build_inference_features(self.history.drop(columns=["AQI"]))


class SavedModelTests(unittest.TestCase):
    def test_loads_model_and_returns_one_numeric_prediction(self):
        model = OneHourAQIPredictor()
        history = pd.DataFrame({
            "timestamp": pd.date_range("2024-01-01", periods=169, freq="h"),
            "AQI": np.linspace(40, 90, 169),
        })
        prediction = model.predict(history)
        self.assertIsInstance(prediction, float)
        self.assertTrue(np.isfinite(prediction))
        self.assertGreaterEqual(prediction, 0)
        self.assertLessEqual(prediction, 500)
        self.assertEqual(model.model.get_booster().feature_names, FEATURE_NAMES)


if __name__ == "__main__":
    unittest.main()
