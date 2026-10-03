import pandas as pd
import numpy as np

from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


DATA_PATH = "data/lucknow_features.csv"


# ==========================================
# 1. Load dataset
# ==========================================

df = pd.read_csv(
    DATA_PATH,
    parse_dates=["timestamp"]
)

df = df.sort_values("timestamp").reset_index(drop=True)

print("Total samples:", len(df))
print("Start:", df["timestamp"].min())
print("End  :", df["timestamp"].max())


# ==========================================
# 2. Define features and target
# ==========================================

features = [
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
    "hour",
    "day_of_week",
    "month",
    "day_of_year",
]

target = "target"


X = df[features]
y = df[target]


# ==========================================
# 3. Chronological split
# ==========================================

train_end = pd.Timestamp("2023-01-01 00:00:00")
validation_end = pd.Timestamp("2023-10-01 00:00:00")

train = df[
    df["timestamp"] < train_end
]

validation = df[
    (df["timestamp"] >= train_end)
    & (df["timestamp"] < validation_end)
]

test = df[
    df["timestamp"] >= validation_end
]


X_train = train[features]
y_train = train[target]

X_val = validation[features]
y_val = validation[target]

X_test = test[features]
y_test = test[target]


print()
print("==============================")
print("DATA SPLIT")
print("==============================")

print("Train:")
print(" ", len(train))
print(" ", train["timestamp"].min(), "→", train["timestamp"].max())

print()
print("Validation:")
print(" ", len(validation))
print(" ", validation["timestamp"].min(), "→", validation["timestamp"].max())

print()
print("Test:")
print(" ", len(test))
print(" ", test["timestamp"].min(), "→", test["timestamp"].max())


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
    n_jobs=-1
)


# ==========================================
# 5. Train
# ==========================================

print()
print("==============================")
print("TRAINING XGBOOST")
print("==============================")

model.fit(
    X_train,
    y_train,
    eval_set=[(X_val, y_val)],
    verbose=False
)
MODEL_PATH = "saved_models/aqi_xgboost.json"

model.save_model(MODEL_PATH)

print()
print("Model saved:", MODEL_PATH)

# ==========================================
# 6. Predictions
# ==========================================

val_pred = model.predict(X_val)
test_pred = model.predict(X_test)


# ==========================================
# 7. Evaluation
# ==========================================

val_mae = mean_absolute_error(y_val, val_pred)
val_rmse = np.sqrt(mean_squared_error(y_val, val_pred))

test_mae = mean_absolute_error(y_test, test_pred)
test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))


print()
print("==============================")
print("MODEL RESULTS")
print("==============================")

print("Validation MAE :", round(val_mae, 2))
print("Validation RMSE:", round(val_rmse, 2))

print()
print("Test MAE       :", round(test_mae, 2))
print("Test RMSE      :", round(test_rmse, 2))


# ==========================================
# 8. Baseline
# ==========================================

baseline_pred = test["lag_1"]

baseline_mae = mean_absolute_error(
    y_test,
    baseline_pred
)

baseline_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        baseline_pred
    )
)

print()
print("==============================")
print("BASELINE")
print("==============================")

print("Baseline MAE :", round(baseline_mae, 2))
print("Baseline RMSE:", round(baseline_rmse, 2))


# ==========================================
# 9. Feature importance
# ==========================================

importance = pd.DataFrame({
    "feature": features,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

print()
print("==============================")
print("FEATURE IMPORTANCE")
print("==============================")

print(importance.to_string(index=False))