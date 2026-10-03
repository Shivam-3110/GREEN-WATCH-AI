import pandas as pd

DATA_PATH = "data/lucknow_hourly.csv"

df = pd.read_csv(DATA_PATH, parse_dates=["timestamp"])

missing = df[df["AQI"].isna()].copy()

print("Total missing hours:", len(missing))

# Find consecutive missing periods
missing["group"] = (
    missing["timestamp"].diff() != pd.Timedelta(hours=1)
).cumsum()

gaps = (
    missing
    .groupby("group")
    .agg(
        start=("timestamp", "min"),
        end=("timestamp", "max"),
        hours=("timestamp", "count")
    )
    .reset_index(drop=True)
)

print()
print("==============================")
print("MISSING AQI GAPS")
print("==============================")

print(gaps)

print()
print("Number of gaps:", len(gaps))
print("Longest gap:", gaps["hours"].max(), "hours")

print()
print("Gap distribution:")
print(gaps["hours"].value_counts().sort_index())

print()
print("==============================")
print("LONG GAPS")
print("==============================")

print(
    gaps[gaps["hours"] >= 12]
)