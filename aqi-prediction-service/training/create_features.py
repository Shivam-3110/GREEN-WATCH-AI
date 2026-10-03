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

df = df.sort_values("timestamp").reset_index(drop=True)

print("Original rows:", len(df))
print("Missing AQI:", df["AQI"].isna().sum())


# ==========================================
# 2. Create lag features
# ==========================================

lag_hours = [
    1, 2, 3, 4, 5, 6,
    12,
    24,
    48,
    72,
    168
]

for lag in lag_hours:
    df[f"lag_{lag}"] = df["AQI"].shift(lag)


# ==========================================
# 3. Time features
# ==========================================

df["hour"] = df["timestamp"].dt.hour

df["day_of_week"] = df["timestamp"].dt.dayofweek

df["month"] = df["timestamp"].dt.month

df["day_of_year"] = df["timestamp"].dt.dayofyear


# ==========================================
# 4. Target
# ==========================================

# Predict AQI one hour into the future
df["target"] = df["AQI"].shift(-1)


# ==========================================
# 5. Remove invalid training samples
# ==========================================

feature_columns = [
    f"lag_{lag}"
    for lag in lag_hours
]

feature_columns += [
    "hour",
    "day_of_week",
    "month",
    "day_of_year"
]

required_columns = feature_columns + ["target"]

before = len(df)

df_model = df.dropna(
    subset=required_columns
).copy()

after = len(df_model)


# ==========================================
# 6. Save
# ==========================================

df_model.to_csv(
    OUTPUT_PATH,
    index=False
)


# ==========================================
# 7. Report
# ==========================================

print()
print("==============================")
print("XGBOOST FEATURE DATASET")
print("==============================")

print("Rows before filtering:", before)
print("Rows after filtering :", after)
print("Rows removed         :", before - after)

print()
print("Features:")
print(feature_columns)

print()
print("Target:")
print("AQI at t + 1 hour")

print()
print("Saved:")
print(OUTPUT_PATH)

print()
print(df_model.head())