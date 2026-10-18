
import pandas as pd

INPUT_PATH = "data/lucknow_hourly.csv"
OUTPUT_PATH = "data/lucknow_features.csv"


# ==========================================
# 1. Load data
# ==========================================

df = pd.read_csv(
    INPUT_PATH,
    parse_dates=["timestamp"]
)

df = (
    df.sort_values("timestamp")
    .drop_duplicates("timestamp")
    .reset_index(drop=True)
)

print("Original rows:", len(df))
print("Missing AQI:", df["AQI"].isna().sum())


# ==========================================
# 2. Create lag features
# ==========================================

lag_hours = [
    1, 2, 3, 4, 5, 6,
    12, 24, 48, 72, 168
]

for lag in lag_hours:
    df[f"lag_{lag}"] = df["AQI"].shift(lag)


# ==========================================
# 3. Create rolling statistical features
# ==========================================

# Shift AQI by one hour first.
# This ensures rolling features use only past observations.
past_aqi = df["AQI"].shift(1)

rolling_windows = [3, 6, 24]

for window in rolling_windows:
    df[f"rolling_mean_{window}"] = (
        past_aqi
        .rolling(window=window, min_periods=window)
        .mean()
    )

# Recent AQI variability.
df["rolling_std_6"] = (
    past_aqi
    .rolling(window=6, min_periods=6)
    .std()
)

# Highest and lowest AQI during the previous 24 hours.
df["rolling_max_24"] = (
    past_aqi
    .rolling(window=24, min_periods=24)
    .max()
)

df["rolling_min_24"] = (
    past_aqi
    .rolling(window=24, min_periods=24)
    .min()
)


# ==========================================
# 4. Create time features
# ==========================================

df["hour"] = df["timestamp"].dt.hour

df["day_of_week"] = df["timestamp"].dt.dayofweek

df["month"] = df["timestamp"].dt.month

df["day_of_year"] = df["timestamp"].dt.dayofyear


# ==========================================
# 5. Create target
# ==========================================

# Predict AQI one hour into the future.
df["target"] = df["AQI"].shift(-1)


# ==========================================
# 6. Define model features
# ==========================================

feature_columns = [
    f"lag_{lag}"
    for lag in lag_hours
]

feature_columns += [
    "rolling_mean_3",
    "rolling_mean_6",
    "rolling_mean_24",
    "rolling_std_6",
    "rolling_max_24",
    "rolling_min_24",
]

feature_columns += [
    "hour",
    "day_of_week",
    "month",
    "day_of_year",
]


# ==========================================
# 7. Remove invalid training samples
# ==========================================

required_columns = feature_columns + ["target"]

before = len(df)

df_model = df.dropna(
    subset=required_columns
).copy()

after = len(df_model)


# ==========================================
# 8. Save feature dataset
# ==========================================

df_model.to_csv(
    OUTPUT_PATH,
    index=False
)


# ==========================================
# 9. Report results
# ==========================================

print()
print("=" * 50)
print("UPDATED XGBOOST FEATURE DATASET")
print("=" * 50)

print("Rows before filtering:", before)
print("Rows after filtering :", after)
print("Rows removed         :", before - after)

print("Number of features   :", len(feature_columns))

print()
print("Features:")
print(feature_columns)

print()
print("Target:")
print("AQI at t + 1 hour")

print()
print("Saved:", OUTPUT_PATH)

print()
print(df_model[["timestamp"] + feature_columns + ["target"]].head())
