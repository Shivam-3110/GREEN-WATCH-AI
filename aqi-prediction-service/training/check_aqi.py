
import pandas as pd

DATA_PATH = "data/cpcb-aqi.parquet"

df = pd.read_parquet(DATA_PATH)

hour_columns = [
    "00:00:00", "01:00:00", "02:00:00", "03:00:00",
    "04:00:00", "05:00:00", "06:00:00", "07:00:00",
    "08:00:00", "09:00:00", "10:00:00", "11:00:00",
    "12:00:00", "13:00:00", "14:00:00", "15:00:00",
    "16:00:00", "17:00:00", "18:00:00", "19:00:00",
    "20:00:00", "21:00:00", "22:00:00", "23:00:00"
]

# Combine all hourly AQI values
hourly_values = df[hour_columns].stack().dropna()

print("\n==============================")
print("AQI STATISTICS")
print("==============================")

print("Count :", len(hourly_values))
print("Min   :", hourly_values.min())
print("Max   :", hourly_values.max())
print("Mean  :", hourly_values.mean())
print("Median:", hourly_values.median())

print("\n==============================")
print("VALUES ABOVE 500")
print("==============================")

above_500 = hourly_values[hourly_values > 500]

print("Count:", len(above_500))
print(above_500.sort_values(ascending=False).head(20))

print("\n==============================")
print("CITY COUNT")
print("==============================")

print("Unique cities:", df["City"].nunique())

print("\nTop cities by number of records:")
print(df["City"].value_counts().head(20))

print("\n==============================")
print("DATE RANGE")
print("==============================")

print("Start:", df["Date"].min())
print("End  :", df["Date"].max())
