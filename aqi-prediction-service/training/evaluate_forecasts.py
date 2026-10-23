
import numpy as np
import pandas as pd

from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


DATA_PATH = "data/lucknow_hourly.csv"
MODEL_PATH = "saved_models/aqi_xgboost_recursive_legacy.json"
OUTPUT_PATH = "data/forecast_evaluation.csv"
HOURLY_OUTPUT_PATH = "data/hourly_forecast_metrics.csv"

LAG_HOURS = [
    1, 2, 3, 4, 5, 6,
    12, 24, 48, 72, 168
]

HORIZONS = [1, 6, 12, 24]


# ==========================================
# 1. Load model and AQI data
# ==========================================

model = XGBRegressor()
model.load_model(MODEL_PATH)

df = pd.read_csv(
    DATA_PATH,
    parse_dates=["timestamp"]
)

df = (
    df.sort_values("timestamp")
    .drop_duplicates("timestamp")
    .reset_index(drop=True)
)

# Keep missing AQI values as missing.
# Do not interpolate them across long gaps.

aqi_by_time = df.set_index("timestamp")["AQI"]

print("Model loaded successfully.")
print("Dataset rows:", len(df))
print(
    "Dataset range:",
    df["timestamp"].min(),
    "to",
    df["timestamp"].max()
)


# ==========================================
# 2. Create features for one timestamp
# ==========================================

def create_features(history, timestamp):
    row = {}

    for lag in LAG_HOURS:
        previous_time = timestamp - pd.Timedelta(hours=lag)

        value = history.get(previous_time, np.nan)

        if pd.isna(value):
            print(
                f"DEBUG: Missing lag_{lag} "
                f"for prediction at {timestamp}. "
                f"Required timestamp: {previous_time}"
            )
            return None

        row[f"lag_{lag}"] = float(value)

    row["hour"] = timestamp.hour
    row["day_of_week"] = timestamp.dayofweek
    row["month"] = timestamp.month
    row["day_of_year"] = timestamp.dayofyear

    return pd.DataFrame([row])


# ==========================================
# 3. Forecast 24 hours recursively
# ==========================================

def forecast_24_hours(start_time):
    # Include observations available at the forecast start.
    history = aqi_by_time.loc[
        aqi_by_time.index <= start_time
    ].to_dict()

    current_time = start_time
    predictions = []

    for step in range(1, 25):
        next_time = current_time + pd.Timedelta(hours=1)

        features = create_features(history, next_time)

        if features is None:
            print(
                f"DEBUG: Forecast starting at {start_time} failed "
                f"at step {step}, timestamp {next_time}"
            )
            return None

        prediction = float(model.predict(features)[0])

        predictions.append({
            "timestamp": next_time,
            "predicted_AQI": prediction
        })

        # Use the prediction as historical input
        # for subsequent forecast steps.
        history[next_time] = prediction

        current_time = next_time

    return pd.DataFrame(predictions)


# ==========================================
# 4. Evaluate multiple forecast windows
# ==========================================

# Test period:
# October 1, 2023 through December 31, 2023.

test_start = pd.Timestamp("2023-10-01 00:00:00")
test_end = pd.Timestamp("2024-01-01 00:00:00")

# Forecasts start daily at midnight and predict the next 24 hours.

forecast_starts = pd.date_range(
    start=test_start,
    end=test_end - pd.Timedelta(hours=24),
    freq="24h"
)

all_results = []
skipped_windows = 0

for start_time in forecast_starts:
    forecast = forecast_24_hours(start_time)

    if forecast is None:
        skipped_windows += 1
        continue

    # Match predictions with actual AQI observations.
    actual = aqi_by_time.reindex(
        forecast["timestamp"]
    ).to_numpy()

    forecast["actual_AQI"] = actual
    forecast["forecast_start"] = start_time

    all_results.append(forecast)

if not all_results:
    raise RuntimeError(
        "No valid forecast windows. "
        "Check AQI history and missing values."
    )

results = pd.concat(
    all_results,
    ignore_index=True
)

# Calculate the forecast horizon in hours.
results["horizon"] = (
    (
        results["timestamp"]
        - results["forecast_start"]
    ) / pd.Timedelta(hours=1)
).astype(int)

# Score only predictions with actual AQI values.
scored = results.dropna(
    subset=["actual_AQI"]
).copy()


# ==========================================
# 4B. Create persistence baseline predictions
# ==========================================

baseline_results = results.copy()

# Predict that AQI remains equal to the last observed AQI
# at the beginning of each forecast window.
baseline_results["baseline_AQI"] = baseline_results[
    "forecast_start"
].map(aqi_by_time)

# Use the same rows for both models.
baseline_scored = baseline_results.dropna(
    subset=["actual_AQI", "baseline_AQI"]
).copy()

baseline_scored["horizon"] = (
    (
        baseline_scored["timestamp"]
        - baseline_scored["forecast_start"]
    ) / pd.Timedelta(hours=1)
).astype(int)

# Ensure both models are evaluated on exactly the same rows.
comparison_scored = scored.merge(
    baseline_scored[
        [
            "timestamp",
            "forecast_start",
            "baseline_AQI"
        ]
    ],
    on=["timestamp", "forecast_start"],
    how="inner"
)

print()
print("=" * 65)
print("XGBOOST VS PERSISTENCE BASELINE")
print("=" * 65)

comparison = []

for horizon in HORIZONS:
    subset = comparison_scored[
        comparison_scored["horizon"] <= horizon
    ]

    if subset.empty:
        continue

    xgb_mae = mean_absolute_error(
        subset["actual_AQI"],
        subset["predicted_AQI"]
    )

    xgb_rmse = np.sqrt(
        mean_squared_error(
            subset["actual_AQI"],
            subset["predicted_AQI"]
        )
    )

    baseline_mae = mean_absolute_error(
        subset["actual_AQI"],
        subset["baseline_AQI"]
    )

    baseline_rmse = np.sqrt(
        mean_squared_error(
            subset["actual_AQI"],
            subset["baseline_AQI"]
        )
    )

    comparison.append({
        "horizon_hours": horizon,
        "samples": len(subset),
        "XGBoost_MAE": round(xgb_mae, 2),
        "Baseline_MAE": round(baseline_mae, 2),
        "XGBoost_RMSE": round(xgb_rmse, 2),
        "Baseline_RMSE": round(baseline_rmse, 2)
    })

comparison_df = pd.DataFrame(comparison)

print(comparison_df.to_string(index=False))


# ==========================================
# 5. Report cumulative horizon metrics
# ==========================================

print()
print("=" * 65)
print("MULTI-WINDOW FORECAST EVALUATION")
print("=" * 65)

print("Forecast windows attempted:", len(forecast_starts))
print("Forecast windows completed:", len(all_results))
print("Windows skipped:", skipped_windows)
print("Predictions with actual AQI:", len(scored))

print()
print("Metrics by cumulative forecast horizon:")

summary = []

for horizon in HORIZONS:
    subset = scored[
        scored["horizon"] <= horizon
    ]

    if subset.empty:
        continue

    mae = mean_absolute_error(
        subset["actual_AQI"],
        subset["predicted_AQI"]
    )

    rmse = np.sqrt(
        mean_squared_error(
            subset["actual_AQI"],
            subset["predicted_AQI"]
        )
    )

    summary.append({
        "horizon_hours": horizon,
        "samples": len(subset),
        "MAE": round(mae, 2),
        "RMSE": round(rmse, 2)
    })

summary_df = pd.DataFrame(summary)

print(summary_df.to_string(index=False))


# ==========================================
# 6. Save detailed forecast results
# ==========================================

results.to_csv(
    OUTPUT_PATH,
    index=False
)

print()
print("Detailed results saved to:", OUTPUT_PATH)


# ==========================================
# 7. Evaluate each forecast hour separately
# ==========================================

print()
print("=" * 65)
print("INDIVIDUAL-HOUR FORECAST EVALUATION")
print("=" * 65)

hourly_metrics = []

for hour in range(1, 25):
    # Predictions for this exact forecast hour.
    subset = comparison_scored[
        comparison_scored["horizon"] == hour
    ]

    if subset.empty:
        continue

    xgb_mae = mean_absolute_error(
        subset["actual_AQI"],
        subset["predicted_AQI"]
    )

    xgb_rmse = np.sqrt(
        mean_squared_error(
            subset["actual_AQI"],
            subset["predicted_AQI"]
        )
    )

    baseline_mae = mean_absolute_error(
        subset["actual_AQI"],
        subset["baseline_AQI"]
    )

    baseline_rmse = np.sqrt(
        mean_squared_error(
            subset["actual_AQI"],
            subset["baseline_AQI"]
        )
    )

    hourly_metrics.append({
        "forecast_hour": hour,
        "samples": len(subset),
        "XGBoost_MAE": round(xgb_mae, 2),
        "Baseline_MAE": round(baseline_mae, 2),
        "XGBoost_RMSE": round(xgb_rmse, 2),
        "Baseline_RMSE": round(baseline_rmse, 2)
    })

# Create and print the table ONCE, outside the loop.
hourly_df = pd.DataFrame(hourly_metrics)

print(hourly_df.to_string(index=False))

hourly_df.to_csv(
    HOURLY_OUTPUT_PATH,
    index=False
)

print()
print("Hourly metrics saved to:", HOURLY_OUTPUT_PATH)
