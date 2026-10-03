import pandas as pd

DATA_PATH = "data/cpcb-aqi.parquet"

df = pd.read_parquet(DATA_PATH)

lucknow = df[
    df["City"].str.lower() == "lucknow"
].copy()

hour_columns = [
    "00:00:00", "01:00:00", "02:00:00", "03:00:00",
    "04:00:00", "05:00:00", "06:00:00", "07:00:00",
    "08:00:00", "09:00:00", "10:00:00", "11:00:00",
    "12:00:00", "13:00:00", "14:00:00", "15:00:00",
    "16:00:00", "17:00:00", "18:00:00", "19:00:00",
    "20:00:00", "21:00:00", "22:00:00", "23:00:00"
]

# Convert wide format -> hourly format
hourly = lucknow.melt(
    id_vars=[
        "Station ID",
        "State",
        "City",
        "Station Name",
        "Date"
    ],
    value_vars=hour_columns,
    var_name="hour",
    value_name="AQI"
)

# Create timestamp
hourly["timestamp"] = pd.to_datetime(
    hourly["Date"].dt.strftime("%Y-%m-%d")
    + " "
    + hourly["hour"]
)

hourly = hourly.dropna(subset=["AQI"])

# ----------------------------------------
# Station count per timestamp
# ----------------------------------------

station_counts = (
    hourly
    .groupby("timestamp")["Station Name"]
    .nunique()
)

print("\n==============================")
print("STATIONS PER TIMESTAMP")
print("==============================")

print(station_counts.value_counts().sort_index())

print("\nAverage stations per timestamp:",
      station_counts.mean())

# ----------------------------------------
# Find timestamps with multiple stations
# ----------------------------------------

multi = hourly[
    hourly["timestamp"].isin(
        station_counts[station_counts > 1].index
    )
]

print("\n==============================")
print("EXAMPLE MULTI-STATION TIMESTAMP")
print("==============================")

example_timestamp = multi["timestamp"].iloc[0]

example = (
    hourly[hourly["timestamp"] == example_timestamp]
    [["timestamp", "Station Name", "AQI"]]
)

print(example.to_string(index=False))

print("\nTimestamp:", example_timestamp)

print("\n==============================")
print("STATION STATISTICS")
print("==============================")

station_stats = (
    hourly
    .groupby("Station Name")["AQI"]
    .agg(["count", "mean", "median", "min", "max"])
    .sort_values("count", ascending=False)
)

print(station_stats)

# ----------------------------------------
# Compare mean vs median across stations
# ----------------------------------------

city_hourly = (
    hourly
    .groupby("timestamp")["AQI"]
    .agg(
        mean="mean",
        median="median",
        minimum="min",
        maximum="max",
        stations="count"
    )
)

print("\n==============================")
print("CITY-LEVEL AGGREGATION")
print("==============================")

print(city_hourly.head(20))

print("\nMean city AQI:")
print(city_hourly["mean"].mean())

print("\nMedian city AQI:")
print(city_hourly["median"].mean())

print("\nMaximum city AQI:")
print(city_hourly["maximum"].mean())