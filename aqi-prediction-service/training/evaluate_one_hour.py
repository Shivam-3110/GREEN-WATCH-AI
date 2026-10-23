"""Re-evaluate the saved one-hour model on its fixed chronological splits."""
import json
import sys
from pathlib import Path

from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "training"))
from train_one_hour import (  # noqa: E402
    FEATURE_NAMES,
    METRICS_PATH,
    MODEL_PATH,
    chronological_splits,
    evaluate,
    load_verified_features,
)


def main() -> None:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Train the model first: {MODEL_PATH}")
    model = XGBRegressor()
    model.load_model(MODEL_PATH)
    model_features = model.get_booster().feature_names
    if model_features != FEATURE_NAMES:
        raise ValueError("Saved model feature ordering differs from the training configuration")
    report = evaluate(model, chronological_splits(load_verified_features()))
    report.update({
        "target": "AQI at timestamp + 1 hour",
        "split_method": "chronological fixed cutoffs; test starts 2023-10-01",
        "prediction_horizon_hours": 1,
        "feature_count": len(FEATURE_NAMES),
        "best_iteration": int(model.best_iteration),
    })
    METRICS_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"Metrics: {METRICS_PATH}")


if __name__ == "__main__":
    main()
