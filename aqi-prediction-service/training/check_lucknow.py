import pandas as pd

DATA_PATH = "data/cpcb-aqi.parquet"

df = pd.read_parquet(DATA_PATH)

lucknow = df[df["City"].str.lower() == "lucknow"].copy()

print("\n==============================")
print("LUCKNOW DATA")
print("==============================")

print("Rows:", len(lucknow))
print("Stations:", lucknow["Station ID"].nunique())
print("Station names:", lucknow["Station Name"].nunique())

print("\nDate range:")
print("Start:", lucknow["Date"].min())
print("End  :", lucknow["Date"].max())

print("\nStations:")
print(lucknow["Station Name"].value_counts())

hour_columns = [
    "00:00:00", "01:00:00", "02:00:00", "03:00:00",
    "04:00:00", "05:00:00", "06:00:00", "07:00:00",
    "08:00:00", "09:00:00", "10:00:00", "11:00:00",
    "12:00:00", "13:00:00", "14:00:00", "15:00:00",
    "16:00:00", "17:00:00", "18:00:00", "19:00:00",
    "20:00:00", "21:00:00", "22:00:00", "23:00:00"
]

values = lucknow[hour_columns].stack().dropna()

print("\nAQI statistics:")
print("Min   :", values.min())
print("Max   :", values.max())
print("Mean  :", values.mean())
print("Median:", values.median())

print("\nValues above 500:", (values > 500).sum())