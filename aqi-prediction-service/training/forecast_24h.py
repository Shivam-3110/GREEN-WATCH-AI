"""Generate a recursive 24-hour Lucknow AQI forecast from hourly history."""
from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from aqi_prediction_service.recursive_forecast import forecast_24h

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "lucknow_hourly.csv"
DEFAULT_OUTPUT = ROOT / "data" / "forecast_24h.csv"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="CSV with timestamp,AQI columns")
    parser.add_argument("--forecast-start", required=True, help="Hourly forecast origin, e.g. 2023-12-31 23:00:00")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output CSV path")
    parser.add_argument("--model", type=Path, default=None, help="22-feature XGBoost model (default: aqi_xgboost.json)")
    args = parser.parse_args()

    observations = pd.read_csv(args.input, parse_dates=["timestamp"])
    result = forecast_24h(observations, args.forecast_start, model_path=args.model)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(args.output, index=False)
    print(result.to_string(index=False))
    print(f"Saved {len(result)} hourly predictions to {args.output}")


if __name__ == "__main__":
    main()
