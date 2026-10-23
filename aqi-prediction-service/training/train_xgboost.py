
import os

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


DATA_PATH = "data/lucknow_features.csv"
MODEL_PATH = "saved_models/aqi_xgboost_recursive_legacy.json"


# ==========================================
# 1. Load dataset
# ==========================================

df = pd.read_csv(DATA_PATH, parse_dates=["timestamp"])
df = df.sort_values("timestamp").reset_index(drop=True)

print("Total samples:", len(df))
print("Start:", df["timestamp"].min())
print("End  :", df["timestamp"].max())


# ==========================================
# 2. Define all 21 features
# ==========================================

lag_features = [
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_4",
    "lag_5",
    "lag_6",
    "lag_12",
    "lag_24",
    "lag_48",
    "lag_72",
    "lag_168",
]

rolling_features = [
    "rolling_mean_3",
    "rolling_mean_6",
    "rolling_mean_24",
    "rolling_std_6",
    "rolling_max_24",
    "rolling_min_24",
]

time_features = [
    "hour",
    "day_of_week",
    "month",
    "day_of_year",
]

features = lag_features + rolling_features + time_features
target = "target"

print("\nNumber of features:", len(features))
print("Features:", features)


# ==========================================
# 3. Chronological split
# ==========================================

train_end = pd.Timestamp("2023-01-01 00:00:00")
validation_end = pd.Timestamp("2023-10-01 00:00:00")

train = df[df["timestamp"] < train_end].copy()

validation = df[
    (df["timestamp"] >= train_end)
    & (df["timestamp"] < validation_end)
].copy()

test = df[df["timestamp"] >= validation_end].copy()


X_train = train[features]
y_train = train[target]

X_val = validation[features]
y_val = validation[target]

X_test = test[features]
y_test = test[target]


print("\n" + "=" * 45)
print("CHRONOLOGICAL DATA SPLIT")
print("=" * 45)

for name, split in [
    ("Training", train),
    ("Validation", validation),
    ("Testing", test),
]:
    print(f"\n{name}:")
    print("  Samples:", len(split))
    print("  Start:", split["timestamp"].min())
    print("  End:", split["timestamp"].max())


# ==========================================
# 4. Create XGBoost model
# ==========================================

model = XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    eval_metric="mae",
    random_state=42,
    n_jobs=-1,
)


# ==========================================
# 5. Train model
# ==========================================

print("\n" + "=" * 45)
print("TRAINING XGBOOST")
print("=" * 45)

model.fit(
    X_train,
    y_train,
    eval_set=[(X_val, y_val)],
    verbose=False,
)


# ==========================================
# 6. Save model
# ==========================================

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
model.save_model(MODEL_PATH)

print("\nModel saved:", MODEL_PATH)


# ==========================================
# 7. Generate predictions
# ==========================================

val_pred = model.predict(X_val)
test_pred = model.predict(X_test)


# ==========================================
# 8. Evaluate model
# ==========================================

val_mae = mean_absolute_error(y_val, val_pred)
val_rmse = np.sqrt(mean_squared_error(y_val, val_pred))

test_mae = mean_absolute_error(y_test, test_pred)
test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))


print("\n" + "=" * 45)
print("MODEL RESULTS")
print("=" * 45)

print("\nValidation:")
print("  MAE :", round(val_mae, 2))
print("  RMSE:", round(val_rmse, 2))

print("\nTest:")
print("  MAE :", round(test_mae, 2))
print("  RMSE:", round(test_rmse, 2))


# ==========================================
# 9. Persistence baseline
# ==========================================

# Predict the next hour using the latest observed AQI.
baseline_pred = test["lag_1"]

baseline_mae = mean_absolute_error(y_test, baseline_pred)
baseline_rmse = np.sqrt(
    mean_squared_error(y_test, baseline_pred)
)

print("\n" + "=" * 45)
print("PERSISTENCE BASELINE")
print("=" * 45)

print("Baseline MAE :", round(baseline_mae, 2))
print("Baseline RMSE:", round(baseline_rmse, 2))


# ==========================================
# 10. Feature importance
# ==========================================

importance = pd.DataFrame({
    "feature": features,
    "importance": model.feature_importances_,
})

importance = importance.sort_values(
    "importance",
    ascending=False,
)

print("\n" + "=" * 45)
print("FEATURE IMPORTANCE")
print("=" * 45)

print(importance.to_string(index=False))
