from pathlib import Path
import sqlite3
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "churn.db"
RAW_CSV_PATH = BASE_DIR / "data" / "raw" / "Telco-Customer-Churn.csv"
SQL_SCHEMA_PATH = BASE_DIR / "sql" / "create_tables.sql"


def init_db():
    """Create database and run schema SQL."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    with open(SQL_SCHEMA_PATH, "r", encoding="utf-8") as f:
        sql_script = f.read()
    cur.executescript(sql_script)
    conn.commit()
    conn.close()
    print("Database initialized and tables created (if not exist).")


def load_raw_into_db():
    """Load raw CSV into customers_raw table."""
    conn = sqlite3.connect(DB_PATH)
    df_raw = pd.read_csv(RAW_CSV_PATH)
    df_raw.to_sql("customers_raw", conn, if_exists="replace", index=False)
    conn.close()
    print(f"Loaded {len(df_raw)} rows into customers_raw table.")


def build_features():
    """Read from customers_raw, apply feature engineering, write customers_features."""
    conn = sqlite3.connect(DB_PATH)
    df_raw = pd.read_sql("SELECT * FROM customers_raw", conn)

    df = df_raw.copy()

    # Clean TotalCharges
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median())

    # Encode target
    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})

    # tenure group
    def tenure_group(t):
        if t <= 6:
            return "0-6"
        elif t <= 12:
            return "6-12"
        elif t <= 24:
            return "12-24"
        elif t <= 48:
            return "24-48"
        else:
            return "48+"

    df["tenure_group"] = df["tenure"].apply(tenure_group)

    # total number of services
    service_cols = [
        "PhoneService",
        "MultipleLines",
        "InternetService",
        "OnlineSecurity",
        "OnlineBackup",
        "DeviceProtection",
        "TechSupport",
        "StreamingTV",
        "StreamingMovies",
    ]
    df["total_services"] = (df[service_cols] != "No").sum(axis=1)

    # long term contract flag
    df["is_long_term"] = df["Contract"].apply(
        lambda x: 1 if x != "Month-to-month" else 0
    )

    # Save customerID separately, drop before one-hot encoding
    customer_ids = df["customerID"]
    df_features = df.drop("customerID", axis=1)

    # One-hot encode categoricals
    cat_cols = df_features.select_dtypes(include="object").columns
    df_encoded = pd.get_dummies(df_features, columns=cat_cols, drop_first=True)

    # Re-attach customerID as first column
    df_encoded.insert(0, "customerID", customer_ids)

    # Write to DB
    df_encoded.to_sql("customers_features", conn, if_exists="replace", index=False)
    conn.close()

    print("customers_features table created.")
    print("Shape:", df_encoded.shape)


def main():
    print("Initializing database and preparing data...")
    init_db()
    load_raw_into_db()
    build_features()
    print("Data preparation finished successfully.")


if __name__ == "__main__":
    main()
