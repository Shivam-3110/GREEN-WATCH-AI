import pandas as pd
import numpy as np

from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


DATA_PATH = "data/lucknow_hourly.csv"
MODEL_PATH = "saved_models/aqi_xgboost.json"


# ==========================================
# 1. Load model
# ==========================================

model = XGBRegressor()

model.load_model(MODEL_PATH)

print("Model loaded successfully.")


# ==========================================
# 2. Load AQI data
# ==========================================

df = pd.read_csv(
    DATA_PATH,
    parse_dates=["timestamp"]
)

df = df.sort_values("timestamp").reset_index(drop=True)


# ==========================================
# 3. Choose a test starting point
# ==========================================

# We will start forecasting from a point
# inside the test period.

start_time = pd.Timestamp("2023-10-15 00:00:00")

start_index = df.index[
    df["timestamp"] == start_time
][0]


# ==========================================
# 4. Get historical AQI
# ==========================================

history = df.loc[
    :start_index,
    ["timestamp", "AQI"]
].copy()


# ==========================================
# 5. Feature creation function
# ==========================================

lag_hours = [
    1, 2, 3, 4, 5, 6,
    12,
    24,
    48,
    72,
    168
]


def create_features(history, timestamp):

    row = {}

    for lag in lag_hours:

        lag_time = timestamp - pd.Timedelta(
            hours=lag
        )

        matching = history[
            history["timestamp"] == lag_time
        ]

        if len(matching) == 0:
            return None

        row[f"lag_{lag}"] = matching["AQI"].iloc[0]

    row["hour"] = timestamp.hour

    row["day_of_week"] = timestamp.dayofweek

    row["month"] = timestamp.month

    row["day_of_year"] = timestamp.dayofyear

    return pd.DataFrame([row])


# ==========================================
# 6. Recursive 24-hour forecasting
# ==========================================

predictions = []

current_time = start_time

print()
print("==============================")
print("24-HOUR FORECAST")
print("==============================")


for step in range(1, 25):

    next_time = current_time + pd.Timedelta(
        hours=1
    )

    features = create_features(
        history,
        next_time
    )

    if features is None:

        print(
            "Cannot create features for:",
            next_time
        )

        break

    prediction = model.predict(
        features
    )[0]

    predictions.append({
        "timestamp": next_time,
        "predicted_AQI": prediction
    })

    # Add prediction to history.
    # This prediction becomes available
    # as a lag for the next prediction.

    history = pd.concat(
        [
            history,
            pd.DataFrame({
                "timestamp": [next_time],
                "AQI": [prediction]
            })
        ],
        ignore_index=True
    )

    current_time = next_time


# ==========================================
# 7. Create prediction dataframe
# ==========================================

forecast = pd.DataFrame(predictions)


print()
print(forecast.to_string(index=False))


# ==========================================
# 8. Compare against actual AQI
# ==========================================

actual = df[
    df["timestamp"].isin(
        forecast["timestamp"]
    )
][
    ["timestamp", "AQI"]
].rename(
    columns={
        "AQI": "actual_AQI"
    }
)


results = forecast.merge(
    actual,
    on="timestamp",
    how="left"
)


# ==========================================
# 9. Calculate error at different horizons
# ==========================================

print()
print("==============================")
print("FORECAST EVALUATION")
print("==============================")


for horizon in [1, 6, 12, 24]:

    subset = results.iloc[:horizon]

    subset = subset.dropna(
        subset=["actual_AQI"]
    )

    if len(subset) == 0:
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

    print()
    print(f"{horizon}-hour horizon")

    print(
        "MAE :",
        round(mae, 2)
    )

    print(
        "RMSE:",
        round(rmse, 2)
    )


# ==========================================
# 10. Save forecast
# ==========================================

OUTPUT_PATH = "data/forecast_24h.csv"

results.to_csv(
    OUTPUT_PATH,
    index=False
)

print()
print("Forecast saved:", OUTPUT_PATH)
