"""Train 24 leakage-safe direct AQI XGBoost models; never overwrite artifacts."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
import xgboost
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from aqi_prediction_service.feature_engineering import FEATURE_NAMES  # noqa: E402
from direct_horizon_common import (  # noqa: E402
    HORIZONS, TRAIN_CUTOFF, VALIDATION_END, build_horizon_frame,
    data_fingerprint, split_horizon_frame,
)

DATA_PATH = ROOT / "data" / "lucknow_hourly.csv"
MODEL_DIR = ROOT / "saved_models" / "direct_horizons"
REPORT_DIR = ROOT / "reports" / "direct_24h_experiment"
PARAMETERS = {
    "n_estimators": 900,
    "learning_rate": 0.04,
    "max_depth": 5,
    "min_child_weight": 3,
    "subsample": 0.8,
    "colsample_bytree": 0.85,
    "reg_lambda": 1.0,
    "objective": "reg:squarederror",
    "eval_metric": "mae",
    "early_stopping_rounds": 35,
    "tree_method": "hist",
    "n_jobs": 4,
    "random_state": 42,
}


def _score(actual: pd.Series, predicted: np.ndarray) -> dict[str, float]:
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(np.sqrt(mean_squared_error(actual, predicted))),
    }


def train_all(data_path: Path = DATA_PATH, model_dir: Path = MODEL_DIR, report_dir: Path = REPORT_DIR) -> dict:
    data = pd.read_csv(data_path, parse_dates=["timestamp"])
    fingerprint = data_fingerprint(data_path)
    if model_dir.exists() and any(model_dir.iterdir()):
        raise FileExistsError(f"Refusing to overwrite direct model artifacts in {model_dir}")
    if report_dir.exists() and any(report_dir.iterdir()):
        raise FileExistsError(f"Refusing to overwrite direct experiment reports in {report_dir}")
    model_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    metadata_rows: list[dict] = []
    failures: list[dict] = []

    for horizon in HORIZONS:
        model_path = model_dir / f"direct_aqi_h{horizon:02d}.json"
        metadata_path = model_dir / f"direct_aqi_h{horizon:02d}_metadata.json"
        try:
            horizon_frame = build_horizon_frame(data, horizon)
            splits = split_horizon_frame(horizon_frame)
            train, validation = splits["train"], splits["validation"]
            if train.empty or validation.empty:
                raise ValueError(f"Insufficient data: train={len(train)}, validation={len(validation)}")
            model = XGBRegressor(**PARAMETERS)
            model.fit(
                train[FEATURE_NAMES], train.target_AQI,
                eval_set=[(validation[FEATURE_NAMES], validation.target_AQI)],
                verbose=False,
            )
            val_predictions = model.predict(validation[FEATURE_NAMES])
            train_predictions = model.predict(train[FEATURE_NAMES])
            val_metrics = _score(validation.target_AQI, val_predictions)
            train_metrics = _score(train.target_AQI, train_predictions)
            model.save_model(model_path)
            metadata = {
                "model_type": "XGBRegressor",
                "model_file": model_path.name,
                "feature_names": FEATURE_NAMES,
                "horizon_hours": horizon,
                "target": f"AQI at origin_timestamp + {horizon} hours",
                "origin_convention": "Feature row timestamp is the last observed AQI timestamp; all features use data through that timestamp only.",
                "training_period": {"rows": len(train), "origin_start": train.timestamp.min().isoformat(), "origin_end": train.timestamp.max().isoformat(), "target_start": train.target_timestamp.min().isoformat(), "target_end": train.target_timestamp.max().isoformat()},
                "validation_period": {"rows": len(validation), "origin_start": validation.timestamp.min().isoformat(), "origin_end": validation.timestamp.max().isoformat(), "target_start": validation.target_timestamp.min().isoformat(), "target_end": validation.target_timestamp.max().isoformat()},
                "split_cutoffs": {"train_target_strictly_before": TRAIN_CUTOFF.isoformat(), "validation_origin_at_or_after": TRAIN_CUTOFF.isoformat(), "validation_target_strictly_before": VALIDATION_END.isoformat(), "purge": f"origin + {horizon}h must be strictly before split boundary"},
                "history_policy": "Canonical feature builder; 169 consecutive observed hourly positions; no interpolation.",
                "training_data": "data/lucknow_hourly.csv",
                "data_sha256": fingerprint,
                "training_parameters": model.get_params(),
                "random_seed": 42,
                "best_iteration": int(model.best_iteration),
                "validation_metrics": val_metrics,
                "training_metrics": train_metrics,
                "xgboost_version": xgboost.__version__,
                "scikit_learn_version": sklearn.__version__,
                "created_utc": datetime.now(timezone.utc).isoformat(),
            }
            metadata_path.write_text(json.dumps(metadata, indent=2, default=str), encoding="utf-8")
            rows.append({"horizon": horizon, "train_rows": len(train), "train_origin_start": train.timestamp.min(), "train_origin_end": train.timestamp.max(), "validation_rows": len(validation), "validation_origin_start": validation.timestamp.min(), "validation_origin_end": validation.timestamp.max(), "best_iteration": int(model.best_iteration), "train_mae": train_metrics["mae"], "train_rmse": train_metrics["rmse"], "validation_mae": val_metrics["mae"], "validation_rmse": val_metrics["rmse"], "target_missing_rows": int((~horizon_frame.label_valid).sum()), "feature_invalid_rows": int((~horizon_frame.features_valid).sum())})
            metadata_rows.append(metadata)
            print(f"Trained lead {horizon:02d}: train={len(train)} validation={len(validation)} validation MAE={val_metrics['mae']:.3f}")
        except Exception as exc:
            # Clean only this run's partial artifact so failed horizons have no misleading model/metadata pair.
            model_path.unlink(missing_ok=True)
            metadata_path.unlink(missing_ok=True)
            failures.append({"horizon": horizon, "error_type": type(exc).__name__, "error": str(exc)})
            print(f"FAILED lead {horizon:02d}: {type(exc).__name__}: {exc}")

    summary = {
        "dataset": str(data_path.relative_to(ROOT)) if data_path.is_relative_to(ROOT) else str(data_path),
        "data_sha256": fingerprint,
        "dataset_range": {"start": str(pd.to_datetime(data.timestamp).min()), "end": str(pd.to_datetime(data.timestamp).max())},
        "training_cutoff": TRAIN_CUTOFF.isoformat(),
        "validation_target_cutoff": VALIDATION_END.isoformat(),
        "test_period": "Q4 2023 may be used only as descriptive, previously examined comparative evaluation; not an untouched confirmatory test.",
        "feature_names": FEATURE_NAMES,
        "model_count_succeeded": len(rows),
        "model_count_failed": len(failures),
        "failures": failures,
        "models": metadata_rows,
        "parameters": PARAMETERS,
    }
    (report_dir / "training_summary.json").write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    if rows:
        pd.DataFrame(rows).to_csv(report_dir / "training_validation_by_lead.csv", index=False)
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DATA_PATH)
    parser.add_argument("--model-dir", type=Path, default=MODEL_DIR)
    parser.add_argument("--report-dir", type=Path, default=REPORT_DIR)
    args = parser.parse_args()
    result = train_all(args.input, args.model_dir, args.report_dir)
    print(json.dumps({key: result[key] for key in ("model_count_succeeded", "model_count_failed", "failures")}, indent=2))
    if result["model_count_failed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
