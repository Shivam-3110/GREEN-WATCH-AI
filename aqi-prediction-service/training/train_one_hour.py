"""Train and score the one-hour Lucknow model using fixed chronological splits."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
import xgboost
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

from aqi_prediction_service.feature_engineering import FEATURE_NAMES, create_feature_frame

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "lucknow_features.csv"
HOURLY_PATH = ROOT / "data" / "lucknow_hourly.csv"
MODEL_DIR = ROOT / "saved_models"
MODEL_PATH = MODEL_DIR / "aqi_xgboost.json"
METRICS_PATH = MODEL_DIR / "aqi_xgboost_metrics.json"
META_PATH = MODEL_DIR / "aqi_xgboost_metadata.json"
TRAIN_CUTOFF = pd.Timestamp("2023-01-01 00:00:00")
TEST_CUTOFF = pd.Timestamp("2023-10-01 00:00:00")
TARGET = "target"


def score(actual: pd.Series, predicted: np.ndarray) -> dict[str, float]:
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(np.sqrt(mean_squared_error(actual, predicted))),
        "r2": float(r2_score(actual, predicted)),
    }


def improvement(model: dict[str, float], baseline: dict[str, float]) -> dict[str, float]:
    return {
        "mae_absolute": baseline["mae"] - model["mae"],
        "mae_percent": 100.0 * (baseline["mae"] - model["mae"]) / baseline["mae"],
        "rmse_absolute": baseline["rmse"] - model["rmse"],
        "rmse_percent": 100.0 * (baseline["rmse"] - model["rmse"]) / baseline["rmse"],
        "r2_absolute": model["r2"] - baseline["r2"],
    }


def load_verified_features() -> pd.DataFrame:
    if not HOURLY_PATH.is_file() or not DATA_PATH.is_file():
        raise FileNotFoundError("Run training/prepare_lucknow.py and training/create_features.py first")
    hourly = pd.read_csv(HOURLY_PATH, parse_dates=["timestamp"])
    if hourly.timestamp.duplicated().any() or hourly.timestamp.isna().any():
        raise ValueError("Hourly source must have unique, valid timestamps")
    hourly = hourly.sort_values("timestamp").reset_index(drop=True)
    if not hourly.timestamp.diff().iloc[1:].eq(pd.Timedelta(hours=1)).all():
        raise ValueError("Hourly source must include the continuous timeline, including missing AQI rows")

    expected = create_feature_frame(hourly)
    expected = expected.loc[expected["next_hour_is_observed"]].dropna(subset=FEATURE_NAMES + [TARGET])
    actual = pd.read_csv(DATA_PATH, parse_dates=["timestamp"]).sort_values("timestamp").reset_index(drop=True)
    needed = ["timestamp", "AQI", *FEATURE_NAMES, TARGET]
    missing = set(needed) - set(actual.columns)
    if missing:
        raise ValueError(f"Feature dataset lacks columns: {sorted(missing)}")
    if not actual.timestamp.equals(expected.timestamp.reset_index(drop=True)):
        raise ValueError("Feature table timestamps do not match current source; regenerate features")
    for column in ["AQI", *FEATURE_NAMES, TARGET]:
        if not np.allclose(actual[column].to_numpy(dtype=float), expected[column].to_numpy(dtype=float), rtol=0, atol=1e-10):
            raise ValueError(f"Feature table column {column!r} differs from shared training preprocessing")
    return actual


def chronological_splits(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    # Purge the final origin in train/validation because its t+1 label belongs
    # to the next split. This keeps both origins and labels inside each block.
    return {
        "train": df[df.timestamp < TRAIN_CUTOFF - pd.Timedelta(hours=1)].copy(),
        "validation": df[(df.timestamp >= TRAIN_CUTOFF) & (df.timestamp < TEST_CUTOFF - pd.Timedelta(hours=1))].copy(),
        "test": df[df.timestamp >= TEST_CUTOFF].copy(),
    }


def evaluate(model: XGBRegressor, splits: dict[str, pd.DataFrame]) -> dict:
    report = {"splits": {}, "model": {}, "persistence_baseline": {}, "improvement_over_baseline": {}}
    for name, part in splits.items():
        if part.empty:
            raise ValueError(f"Chronological {name} split is empty")
        report["splits"][name] = {
            "rows": int(len(part)),
            "start": part.timestamp.min().isoformat(),
            "end": part.timestamp.max().isoformat(),
        }
        y_hat = model.predict(part[FEATURE_NAMES])
        baseline = part["current_aqi"].to_numpy(dtype=float)
        report["model"][name] = score(part[TARGET], y_hat)
        report["persistence_baseline"][name] = score(part[TARGET], baseline)
        report["improvement_over_baseline"][name] = improvement(
            report["model"][name], report["persistence_baseline"][name]
        )
    return report


def main() -> None:
    df = load_verified_features()
    splits = chronological_splits(df)
    if any(part.empty for part in splits.values()):
        raise ValueError("Train, validation, and test splits must all contain samples")

    # Validation drives early stopping/model selection; test is scored only
    # after model fitting and is never supplied to fit().
    model = XGBRegressor(
        n_estimators=900,
        learning_rate=0.04,
        max_depth=5,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.85,
        reg_lambda=1.0,
        objective="reg:squarederror",
        eval_metric="mae",
        early_stopping_rounds=35,
        tree_method="hist",
        n_jobs=4,
        random_state=42,
    )
    model.fit(
        splits["train"][FEATURE_NAMES],
        splits["train"][TARGET],
        eval_set=[(splits["validation"][FEATURE_NAMES], splits["validation"][TARGET])],
        verbose=False,
    )
    report = evaluate(model, splits)
    report.update({
        "target": "AQI at timestamp + 1 hour",
        "split_method": "chronological fixed cutoffs; validation used for early stopping",
        "prediction_horizon_hours": 1,
        "feature_count": len(FEATURE_NAMES),
        "best_iteration": int(model.best_iteration),
        "best_validation_mae": float(model.best_score),
    })

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.save_model(MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    metadata = {
        "model_version": "1.0.0",
        "model_type": "XGBRegressor",
        "model_file": MODEL_PATH.name,
        "feature_names": FEATURE_NAMES,
        "prediction_horizon_hours": 1,
        "target": "AQI at timestamp + 1 hour",
        "training_period": report["splits"]["train"],
        "validation_period": report["splits"]["validation"],
        "test_period": report["splits"]["test"],
        "evaluation_metrics": {
            "model_test": report["model"]["test"],
            "persistence_test": report["persistence_baseline"]["test"],
            "improvement_over_baseline": report["improvement_over_baseline"]["test"],
        },
        "expected_input_schema": {
            "columns": {"timestamp": "hourly timestamp", "AQI": "numeric AQI in [0, 500]"},
            "minimum_history": "169 hourly positions through the latest observed AQI",
            "location_scope": "Lucknow city-median series",
            "missing_values": "required lag/window AQI values must be observed; no imputation",
        },
        "training_data": "data/lucknow_hourly.csv -> data/lucknow_features.csv",
        "xgboost_version": xgboost.__version__,
        "scikit_learn_version": sklearn.__version__,
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "training_parameters": model.get_params(),
    }
    META_PATH.write_text(json.dumps(metadata, indent=2, default=str), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"Model: {MODEL_PATH}")
    print(f"Metadata: {META_PATH}")
    print(f"Metrics: {METRICS_PATH}")


if __name__ == "__main__":
    main()
