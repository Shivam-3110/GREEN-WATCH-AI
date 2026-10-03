
import pandas as pd

DATA_PATH = "data/cpcb-aqi.parquet"
OUTPUT_PATH = "data/lucknow_hourly.csv"

# ==========================================
# 1. Load dataset
# ==========================================

df = pd.read_parquet(DATA_PATH)

# Keep only Lucknow
lucknow = df[
    df["City"].str.lower() == "lucknow"
].copy()

print("Lucknow rows:", len(lucknow))


# ==========================================
# 2. Hour columns
# ==========================================

hour_columns = [
    "00:00:00", "01:00:00", "02:00:00", "03:00:00",
    "04:00:00", "05:00:00", "06:00:00", "07:00:00",
    "08:00:00", "09:00:00", "10:00:00", "11:00:00",
    "12:00:00", "13:00:00", "14:00:00", "15:00:00",
    "16:00:00", "17:00:00", "18:00:00", "19:00:00",
    "20:00:00", "21:00:00", "22:00:00", "23:00:00"
]


# ==========================================
# 3. Convert wide format → hourly format
# ==========================================

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


# ==========================================
# 4. Create timestamp
# ==========================================

hourly["timestamp"] = pd.to_datetime(
    hourly["Date"].dt.strftime("%Y-%m-%d")
    + " "
    + hourly["hour"]
)


# ==========================================
# 5. Remove missing AQI observations
# ==========================================

hourly = hourly.dropna(subset=["AQI"])


# ==========================================
# 6. Aggregate stations
# ==========================================

city_hourly = (
    hourly
    .groupby("timestamp")["AQI"]
    .median()
    .reset_index()
)


# ==========================================
# 7. Create continuous hourly timeline
# ==========================================

full_range = pd.date_range(
    start=city_hourly["timestamp"].min(),
    end=city_hourly["timestamp"].max(),
    freq="h"
)

city_hourly = (
    city_hourly
    .set_index("timestamp")
    .reindex(full_range)
)

city_hourly.index.name = "timestamp"

city_hourly = city_hourly.reset_index()


# ==========================================
# 8. Report missing timestamps
# ==========================================

missing_count = city_hourly["AQI"].isna().sum()

print()
print("==============================")
print("CLEAN LUCKNOW SERIES")
print("==============================")

print("Start:", city_hourly["timestamp"].min())
print("End  :", city_hourly["timestamp"].max())

print("Total expected hours:", len(city_hourly))
print("Missing AQI hours   :", missing_count)


# ==========================================
# 9. Save
# ==========================================

city_hourly.to_csv(
    OUTPUT_PATH,
    index=False
)

print()
print("Saved:", OUTPUT_PATH)
print()
print(city_hourly.head(10))

