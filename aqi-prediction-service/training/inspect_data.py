
import pandas as pd

DATA_PATH = "data/cpcb-aqi.parquet"

# Load dataset
df = pd.read_parquet(DATA_PATH)

print("\n==============================")
print("DATASET INFORMATION")
print("==============================")

print("Rows    :", len(df))
print("Columns :", len(df.columns))

print("\n==============================")
print("COLUMNS")
print("==============================")

for column in df.columns:
    print("-", column)

print("\n==============================")
print("FIRST 5 ROWS")
print("==============================")

print(df.head())

print("\n==============================")
print("DATA TYPES")
print("==============================")

print(df.dtypes)

print("\n==============================")
print("MISSING VALUES")
print("==============================")

print(df.isnull().sum())

print("\n==============================")
print("DATASET SHAPE")
print("==============================")

print(df.shape)

