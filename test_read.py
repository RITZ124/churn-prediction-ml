import pandas as pd

df = pd.read_csv("data/raw/Telco-Customer-Churn.csv")
print("Rows:", df.shape[0], "Columns:", df.shape[1])
print("Columns:", list(df.columns))
