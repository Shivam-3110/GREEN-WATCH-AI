"""Backtest recursive Lucknow forecasts on daily 23:00 origins."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from aqi_prediction_service.recursive_forecast import forecast_24h  # noqa: E402
from aqi_prediction_service.one_hour_inference import OneHourAQIPredictor  # noqa: E402

DATA_PATH = ROOT / "data" / "lucknow_hourly.csv"
DEFAULT_OUTPUT_DIR = ROOT / "reports" / "recursive_24h_backtest"
BACKTEST_START = pd.Timestamp("2023-10-01 23:00:00")
BACKTEST_END = pd.Timestamp("2023-12-31 23:00:00")
HORIZONS = (1, 6, 12, 24)
PREDICTION_COLUMNS = [
    "origin_timestamp", "target_timestamp", "lead_hour", "predicted_AQI", "actual_AQI",
    "baseline_AQI", "model_error", "model_absolute_error", "baseline_error", "baseline_absolute_error",
]


def _validated_hourly(data: pd.DataFrame) -> pd.DataFrame:
    if not {"timestamp", "AQI"}.issubset(data.columns):
        raise ValueError("hourly data must contain timestamp and AQI columns")
    frame = data[["timestamp", "AQI"]].copy()
    frame["timestamp"] = pd.to_datetime(frame.timestamp, errors="raise")
    if frame.empty or frame.timestamp.isna().any():
        raise ValueError("hourly data must contain valid timestamps")
    if frame.timestamp.duplicated().any():
        raise ValueError("hourly data contains duplicate timestamps")
    if not frame.timestamp.is_monotonic_increasing:
        raise ValueError("hourly data must be sorted in ascending timestamp order")
    if not pd.api.types.is_numeric_dtype(frame.AQI):
        raise ValueError("AQI values must be numeric")
    return frame.reset_index(drop=True)


def _metric_row(frame: pd.DataFrame, label: int, kind: str) -> dict:
    valid = frame.dropna(subset=["actual_AQI", "predicted_AQI", "baseline_AQI"])
    if kind == "lead":
        valid = valid.loc[valid.lead_hour == label]
    else:
        valid = valid.loc[valid.lead_hour <= label]
    if valid.empty:
        model_mae = model_rmse = baseline_mae = baseline_rmse = np.nan
    else:
        actual = valid.actual_AQI.to_numpy(dtype=float)
        predicted = valid.predicted_AQI.to_numpy(dtype=float)
        baseline = valid.baseline_AQI.to_numpy(dtype=float)
        model_mae = mean_absolute_error(actual, predicted)
        model_rmse = np.sqrt(mean_squared_error(actual, predicted))
        baseline_mae = mean_absolute_error(actual, baseline)
        baseline_rmse = np.sqrt(mean_squared_error(actual, baseline))
    total_pairs = int((frame.lead_hour == label).sum()) if kind == "lead" else int((frame.lead_hour <= label).sum())
    missing_targets = int(frame.loc[frame.lead_hour == label, "actual_AQI"].isna().sum()) if kind == "lead" else int(
        frame.loc[frame.lead_hour <= label, "actual_AQI"].isna().sum()
    )
    return {
        "lead_hour" if kind == "lead" else "horizon_hours": label,
        "valid_pairs": int(len(valid)),
        "missing_target_pairs": missing_targets,
        "model_MAE": float(model_mae),
        "model_RMSE": float(model_rmse),
        "baseline_MAE": float(baseline_mae),
        "baseline_RMSE": float(baseline_rmse),
        "MAE_difference_model_minus_baseline": float(model_mae - baseline_mae),
        "RMSE_difference_model_minus_baseline": float(model_rmse - baseline_rmse),
    }


def calculate_metrics(predictions: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Calculate per-lead and pooled cumulative metrics on matched valid pairs."""
    leads = pd.DataFrame([_metric_row(predictions, lead, "lead") for lead in range(1, 25)])
    horizons = pd.DataFrame([_metric_row(predictions, horizon, "horizon") for horizon in HORIZONS])
    return leads, horizons


def run_backtest(
    data: pd.DataFrame,
    predictor,
    *,
    start: pd.Timestamp = BACKTEST_START,
    end: pd.Timestamp = BACKTEST_END,
) -> tuple[pd.DataFrame, dict]:
    """Run daily-origin backtest while keeping future targets outside inference."""
    hourly = _validated_hourly(data)
    by_time = hourly.set_index("timestamp").AQI
    # Consider every daily origin at the chosen hour that is present in the source.
    candidate_grid = pd.date_range(start=start, end=end, freq="24h")
    origins = candidate_grid.intersection(pd.DatetimeIndex(hourly.timestamp))
    rows: list[dict] = []
    skipped: list[dict] = []

    for origin in origins:
        target_times = pd.date_range(origin + pd.Timedelta(hours=1), periods=24, freq="h")
        absent = target_times.difference(pd.DatetimeIndex(hourly.timestamp))
        if len(absent):
            skipped.append({"origin_timestamp": origin.isoformat(), "reason": "incomplete_target_timestamp_window", "missing_timestamps": int(len(absent))})
            continue
        origin_aqi = by_time.get(origin, np.nan)
        if pd.isna(origin_aqi):
            skipped.append({"origin_timestamp": origin.isoformat(), "reason": "missing_AQI_at_origin"})
            continue

        # This is the only history passed to the forecast; actual target values
        # are looked up only after all 24 predictions have been generated.
        history = hourly.loc[hourly.timestamp <= origin, ["timestamp", "AQI"]].copy()
        try:
            forecast = forecast_24h(history, origin, predictor)
        except Exception as exc:
            reason = str(exc).replace("\n", " ")
            skipped.append({"origin_timestamp": origin.isoformat(), "reason": "forecast_error", "detail": reason})
            continue
        if len(forecast) != 24 or forecast.horizon.tolist() != list(range(1, 25)):
            skipped.append({"origin_timestamp": origin.isoformat(), "reason": "invalid_forecast_shape"})
            continue
        actual = by_time.reindex(forecast.timestamp).to_numpy(dtype=float)
        baseline = np.full(24, float(origin_aqi), dtype=float)
        result = pd.DataFrame({
            "origin_timestamp": forecast.forecast_start,
            "target_timestamp": forecast.timestamp,
            "lead_hour": forecast.horizon,
            "predicted_AQI": forecast.predicted_AQI,
            "actual_AQI": actual,
            "baseline_AQI": baseline,
        })
        result["model_error"] = result.predicted_AQI - result.actual_AQI
        result["model_absolute_error"] = result.model_error.abs()
        result["baseline_error"] = result.baseline_AQI - result.actual_AQI
        result["baseline_absolute_error"] = result.baseline_error.abs()
        rows.extend(result[PREDICTION_COLUMNS].to_dict("records"))

    predictions = pd.DataFrame(rows, columns=PREDICTION_COLUMNS)
    summary = {
        "dataset_range": {"start": hourly.timestamp.min().isoformat(), "end": hourly.timestamp.max().isoformat()},
        "backtest_origin_range": {"start": start.isoformat(), "end": end.isoformat()},
        "origin_convention": "Daily at 23:00; origin is the final observed timestamp. Lead 1 is origin + 1 hour.",
        "target_window": "The next 24 hourly timestamps, origin + 1 hour through origin + 24 hours inclusive.",
        "attempted_origins": int(len(origins)),
        "completed_origins": int(predictions.origin_timestamp.nunique()) if not predictions.empty else 0,
        "skipped_origins": int(len(skipped)),
        "skip_reasons": {},
        "missing_target_pairs": int(predictions.actual_AQI.isna().sum()) if not predictions.empty else 0,
        "forecast_prediction_pairs": int(len(predictions)),
        "scored_prediction_target_pairs": int(predictions.actual_AQI.notna().sum()) if not predictions.empty else 0,
        "skipped_origin_details": skipped,
    }
    for item in skipped:
        reason = item["reason"]
        summary["skip_reasons"][reason] = summary["skip_reasons"].get(reason, 0) + 1
    return predictions, summary


def write_report(output_dir: Path, predictions: pd.DataFrame, summary: dict, model_path: Path) -> None:
    if output_dir.exists() and any(output_dir.iterdir()):
        raise FileExistsError(f"Refusing to overwrite existing backtest outputs: {output_dir}")
    output_dir.mkdir(parents=True, exist_ok=True)
    by_lead, by_horizon = calculate_metrics(predictions)
    predictions.to_csv(output_dir / "forecast_predictions.csv", index=False)
    by_lead.to_csv(output_dir / "metrics_by_lead_hour.csv", index=False)
    by_horizon.to_csv(output_dir / "metrics_by_horizon.csv", index=False)
    summary["model_artifact"] = str(model_path.relative_to(ROOT)) if model_path.is_relative_to(ROOT) else str(model_path)
    summary["metric_definitions"] = {
        "error": "prediction minus actual; MAE/RMSE use valid actual targets only",
        "difference": "model metric minus persistence metric; negative favors the model",
        "cumulative": "pooled errors over all lead hours 1 through the horizon across completed windows",
        "baseline": "AQI observed at the origin repeated for all 24 lead hours",
    }
    (output_dir / "backtest_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    table_columns = ["horizon_hours", "valid_pairs", "missing_target_pairs", "model_MAE", "model_RMSE", "baseline_MAE", "baseline_RMSE", "MAE_difference_model_minus_baseline", "RMSE_difference_model_minus_baseline"]
    table_lines = ["| " + " | ".join(table_columns) + " |", "| " + " | ".join(["---"] * len(table_columns)) + " |"]
    for _, row in by_horizon.iterrows():
        values = [f"{int(row[column])}" if column in {"horizon_hours", "valid_pairs", "missing_target_pairs"} else f"{row[column]:.3f}" for column in table_columns]
        table_lines.append("| " + " | ".join(values) + " |")
    report = [
        "# Recursive 24-hour Lucknow AQI backtest",
        "",
        "## Method",
        "",
        f"- Dataset range: {summary['dataset_range']['start']} to {summary['dataset_range']['end']}",
        f"- Origins: {summary['origin_convention']}",
        f"- Target alignment: {summary['target_window']}",
        f"- Model: `{summary['model_artifact']}` through the shared one-hour inference and recursive forecast code.",
        "- Forecast history was cut off at each origin. Actual values were joined only after forecasting.",
        "- Persistence predicts the observed AQI at the origin for all lead hours. Model and baseline use identical valid target pairs.",
        "- Cumulative metrics pool every valid origin/lead pair from lead 1 through the named horizon.",
        "- Missing AQI targets remain in the prediction output and are excluded from both model and baseline metrics.",
        "",
        "## Run counts",
        "",
        f"- Attempted origins: {summary['attempted_origins']}",
        f"- Completed origins: {summary['completed_origins']}",
        f"- Skipped origins: {summary['skipped_origins']} ({summary['skip_reasons']})",
        f"- Forecast rows: {summary['forecast_prediction_pairs']}; scored pairs: {summary['scored_prediction_target_pairs']}; missing targets: {summary['missing_target_pairs']}.",
        "",
        "## Cumulative metrics",
        "",
        "Differences are model minus baseline; negative values favor the model.",
        "",
        *table_lines,
        "",
        "## Interpretation and limitations",
        "",
        "This is a retrospective evaluation on one Lucknow city-median series ending in 2023. The model is recursively rolled forward, so multi-hour errors can compound. Daily 23:00 origins produce non-overlapping 24-hour target windows. The result does not establish current-period accuracy, generalization to other cities, or production readiness. No model was retrained or modified.",
        "",
        "Per-lead metrics and all prediction rows are in the adjacent CSV files; detailed skip reasons are in `backtest_summary.json`.",
        "",
    ]
    (output_dir / "BACKTEST_REPORT.md").write_text("\n".join(report), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DATA_PATH)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()
    data = pd.read_csv(args.input, parse_dates=["timestamp"])
    model_path = ROOT / "saved_models" / "aqi_xgboost.json"
    predictor = OneHourAQIPredictor(model_path)
    predictions, summary = run_backtest(data, predictor)
    if predictions.empty:
        raise RuntimeError(f"Backtest produced no completed origins: {summary['skip_reasons']}")
    write_report(args.output_dir, predictions, summary, model_path)
    print(json.dumps(summary, indent=2))
    print("Cumulative metrics:")
    print(calculate_metrics(predictions)[1].to_string(index=False))
    print(f"Reports saved to {args.output_dir}")


if __name__ == "__main__":
    main()
