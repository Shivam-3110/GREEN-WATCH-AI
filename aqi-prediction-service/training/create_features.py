"""Generate the one-hour Lucknow AQI training table from lucknow_hourly.csv."""
from pathlib import Path

import pandas as pd

from aqi_prediction_service.feature_engineering import FEATURE_NAMES, create_feature_frame

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "data" / "lucknow_hourly.csv"
OUTPUT_PATH = ROOT / "data" / "lucknow_features.csv"


def main() -> None:
    observations = pd.read_csv(INPUT_PATH, parse_dates=["timestamp"])
    observations = observations.sort_values("timestamp").drop_duplicates("timestamp").reset_index(drop=True)
    features = create_feature_frame(observations)
    usable = features.loc[features["next_hour_is_observed"]].dropna(subset=FEATURE_NAMES + ["target"]).copy()
    usable.to_csv(OUTPUT_PATH, index=False)
    print(f"Hourly rows: {len(observations)}")
    print(f"Missing AQI observations: {int(observations.AQI.isna().sum())}")
    print(f"Usable one-hour examples: {len(usable)}")
    print(f"Feature count: {len(FEATURE_NAMES)}")
    print(f"Target: AQI at timestamp + 1 hour")
    print(f"Saved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
