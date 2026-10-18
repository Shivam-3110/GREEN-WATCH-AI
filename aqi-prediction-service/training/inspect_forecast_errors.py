
import pandas as pd
import numpy as np

RESULTS_PATH = "data/forecast_evaluation.csv"

df = pd.read_csv(
    RESULTS_PATH,
    parse_dates=["timestamp", "forecast_start"]
)

# Keep rows with actual AQI values.
df = df.dropna(
    subset=["actual_AQI", "predicted_AQI"]
).copy()

# Calculate absolute prediction error.
df["absolute_error"] = (
    df["actual_AQI"] - df["predicted_AQI"]
).abs()

# Summarize each forecast window.
window_summary = (
    df.groupby("forecast_start")
    .agg(
        samples=("absolute_error", "count"),
        MAE=("absolute_error", "mean"),
        RMSE=(
            "absolute_error",
            lambda errors: np.sqrt(np.mean(errors ** 2))
        )
    )
    .reset_index()
)

window_summary["MAE"] = window_summary["MAE"].round(2)
window_summary["RMSE"] = window_summary["RMSE"].round(2)

# Show the ten windows with the largest MAE.
worst_windows = window_summary.sort_values(
    "MAE",
    ascending=False
).head(10)

print("\nWORST FORECAST WINDOWS")
print(worst_windows.to_string(index=False))

# Inspect hourly predictions in the worst window.
if not worst_windows.empty:
    worst_start = worst_windows.iloc[0]["forecast_start"]

    worst_details = df[
        df["forecast_start"] == worst_start
    ].copy()

    worst_details["error"] = (
        worst_details["actual_AQI"]
        - worst_details["predicted_AQI"]
    )

    columns = [
        "forecast_start",
        "timestamp",
        "actual_AQI",
        "predicted_AQI",
        "error",
        "absolute_error"
    ]

    print("\nDETAILS OF WORST WINDOW")
    print(
        worst_details[columns]
        .round(2)
        .to_string(index=False)
    )

    worst_details[columns].to_csv(
        "data/worst_forecast_window.csv",
        index=False
    )

    print("\nSaved: data/worst_forecast_window.csv")

