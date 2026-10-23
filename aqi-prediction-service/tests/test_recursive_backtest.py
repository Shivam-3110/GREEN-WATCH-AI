import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "training"))
from evaluate_recursive_24h import calculate_metrics, run_backtest  # noqa: E402


class ConstantPredictor:
    def __init__(self, value=150.0):
        self.value = value
        self.histories = []

    def predict(self, history):
        self.histories.append(history.copy())
        return self.value


class RecursiveBacktestTests(unittest.TestCase):
    def setUp(self):
        self.start = pd.Timestamp("2023-10-01 23:00:00")
        timestamps = pd.date_range(self.start - pd.Timedelta(hours=168), periods=169 + 48, freq="h")
        aqi = np.arange(len(timestamps), dtype=float) + 100
        self.data = pd.DataFrame({"timestamp": timestamps, "AQI": aqi})
        # Missing target: first origin, lead 3. A later missing target is kept
        # distinct from the AQI observed at either forecast origin.
        self.data.loc[self.data.timestamp == self.start + pd.Timedelta(hours=3), "AQI"] = np.nan

    def run_case(self):
        predictor = ConstantPredictor(499.0)
        predictions, summary = run_backtest(
            self.data, predictor, start=self.start, end=self.start + pd.Timedelta(days=2)
        )
        return predictions, summary, predictor

    def test_origin_alignment_future_isolation_and_baseline(self):
        predictions, summary, predictor = self.run_case()
        first_window = predictions[predictions.origin_timestamp == self.start]
        self.assertEqual(first_window.target_timestamp.iloc[0], self.start + pd.Timedelta(hours=1))
        self.assertEqual(first_window.lead_hour.iloc[-1], 24)
        latest = float(self.data.loc[self.data.timestamp == self.start, "AQI"].iloc[0])
        self.assertTrue((first_window.baseline_AQI == latest).all())
        # Each recursive run's first call contains only observed values through
        # its origin. Later synthetic rows contain the predictor sentinel.
        first_history = predictor.histories[0]
        self.assertLessEqual(first_history.timestamp.max(), self.start)
        self.assertFalse((first_history.AQI == predictor.value).any())
        for history in predictor.histories[:24]:
            after_origin = history.loc[history.timestamp > self.start, "AQI"]
            self.assertTrue(after_origin.empty or (after_origin == predictor.value).all())
        self.assertEqual(summary["attempted_origins"], 3)

    def test_missing_targets_are_excluded_from_both_metrics_and_reported(self):
        predictions, summary, _ = self.run_case()
        self.assertTrue(predictions.loc[predictions.target_timestamp == self.start + pd.Timedelta(hours=3), "actual_AQI"].isna().all())
        self.assertTrue(predictions.loc[predictions.target_timestamp == self.start + pd.Timedelta(hours=3), "model_error"].isna().all())
        self.assertEqual(summary["missing_target_pairs"], 1)
        self.assertEqual(summary["completed_origins"], 1)
        self.assertEqual(summary["skipped_origins"], 2)
        self.assertEqual(summary["skip_reasons"], {
            "forecast_error": 1,
            "incomplete_target_timestamp_window": 1,
        })
        per_lead, cumulative = calculate_metrics(predictions)
        lead3 = per_lead.loc[per_lead.lead_hour == 3].iloc[0]
        self.assertEqual(lead3.valid_pairs, 0)
        self.assertEqual(lead3.missing_target_pairs, 1)
        h6 = cumulative.loc[cumulative.horizon_hours == 6].iloc[0]
        self.assertEqual(h6.valid_pairs, 5)
        self.assertEqual(h6.missing_target_pairs, 1)

    def test_metrics_are_correct_per_lead_and_pooled_horizon(self):
        predictions, _, _ = self.run_case()
        per_lead, cumulative = calculate_metrics(predictions)
        lead1 = predictions.loc[(predictions.lead_hour == 1) & predictions.actual_AQI.notna()]
        expected_mae = np.mean(np.abs(lead1.predicted_AQI - lead1.actual_AQI))
        expected_rmse = np.sqrt(np.mean((lead1.predicted_AQI - lead1.actual_AQI) ** 2))
        row = per_lead.loc[per_lead.lead_hour == 1].iloc[0]
        self.assertAlmostEqual(row.model_MAE, expected_mae)
        self.assertAlmostEqual(row.model_RMSE, expected_rmse)
        h6_pairs = predictions.loc[(predictions.lead_hour <= 6) & predictions.actual_AQI.notna()]
        expected_cum_mae = np.mean(np.abs(h6_pairs.predicted_AQI - h6_pairs.actual_AQI))
        row6 = cumulative.loc[cumulative.horizon_hours == 6].iloc[0]
        self.assertAlmostEqual(row6.model_MAE, expected_cum_mae)
        self.assertEqual(row6.valid_pairs, len(h6_pairs))
        self.assertAlmostEqual(row6.MAE_difference_model_minus_baseline, row6.model_MAE - row6.baseline_MAE)

    def test_repeated_run_is_deterministic(self):
        first, summary1, _ = self.run_case()
        second, summary2, _ = self.run_case()
        pd.testing.assert_frame_equal(first, second)
        self.assertEqual(summary1, summary2)


if __name__ == "__main__":
    unittest.main()
