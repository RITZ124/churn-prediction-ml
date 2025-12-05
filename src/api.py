from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

import numpy as np
import pandas as pd
import pickle
import sqlite3
from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware


# -----------------------------
# Paths and global objects
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "best_model.pkl"
DB_PATH = BASE_DIR / "churn.db"

with open(MODEL_PATH, "rb") as f:
    artifact = pickle.load(f)

model = artifact["model"]
scaler = artifact["scaler"]
feature_cols = artifact["feature_cols"]
numeric_cols = artifact["numeric_cols"]


def get_db_connection():
    return sqlite3.connect(DB_PATH)


def get_risk_label(prob: float) -> str:
    if prob < 0.33:
        return "LOW"
    elif prob < 0.66:
        return "MEDIUM"
    else:
        return "HIGH"


# -----------------------------
# Pydantic schema
# -----------------------------
class CustomerInput(BaseModel):
    customerID: str
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: Optional[float] = None


# -----------------------------
# FastAPI app + CORS
# -----------------------------
app = FastAPI(title="Customer Churn Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Churn prediction API is running"}


# -----------------------------
# Feature pipeline for 1 row
# -----------------------------
def build_feature_row(data: CustomerInput) -> tuple[pd.DataFrame, str]:
    d = data.dict()
    df = pd.DataFrame([d])

    # Clean TotalCharges
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    if df["TotalCharges"].isna().any():
        df["TotalCharges"] = df["MonthlyCharges"] * df["tenure"]

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

    # total services
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

    # long term contract
    df["is_long_term"] = df["Contract"].apply(
        lambda x: 1 if x != "Month-to-month" else 0
    )

    customer_id = df["customerID"].iloc[0]
    df_features = df.drop(["customerID"], axis=1)

    cat_cols = df_features.select_dtypes(include="object").columns
    df_encoded = pd.get_dummies(df_features, columns=cat_cols, drop_first=True)

    # ensure all train cols
    for col in feature_cols:
        if col not in df_encoded.columns:
            df_encoded[col] = 0

    df_encoded = df_encoded[feature_cols]

    # scale numeric
    df_encoded[numeric_cols] = scaler.transform(df_encoded[numeric_cols])

    return df_encoded, customer_id


# -----------------------------
# Predict endpoint
# -----------------------------
@app.post("/predict_churn")
def predict_churn(customer: CustomerInput):
    X, customer_id = build_feature_row(customer)
    prob = float(model.predict_proba(X)[0, 1])
    risk_label = get_risk_label(prob)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO predictions (customerID, churn_probability, risk_label)
        VALUES (?, ?, ?)
        """,
        (customer_id, prob, risk_label),
    )
    conn.commit()
    conn.close()

    return {
        "customerID": customer_id,
        "churn_probability": prob,
        "risk_label": risk_label,
    }


# -----------------------------
# History endpoint
# -----------------------------
@app.get("/predictions")
def list_predictions(limit: int = 50):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, customerID, churn_probability, risk_label, predicted_at
        FROM predictions
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )
    rows = cur.fetchall()
    conn.close()

    items = [
        {
            "id": r[0],
            "customerID": r[1],
            "churn_probability": r[2],
            "risk_label": r[3],
            "predicted_at": r[4],
        }
        for r in rows
    ]
    return {"items": items}


# -----------------------------
# Churn stats endpoint
# -----------------------------
@app.get("/stats/churn")
def churn_stats():
    conn = get_db_connection()
    df_raw = pd.read_sql("SELECT * FROM customers_raw", conn)

    total = len(df_raw)
    churn_yes = (df_raw["Churn"] == "Yes").sum()
    churn_rate = churn_yes / total if total else 0.0

    by_contract = (
        df_raw.groupby("Contract")["Churn"]
        .apply(lambda s: (s == "Yes").sum() / len(s) if len(s) else 0.0)
        .reset_index()
        .rename(columns={"Churn": "churn_rate"})
    )

    by_payment = (
        df_raw.groupby("PaymentMethod")["Churn"]
        .apply(lambda s: (s == "Yes").sum() / len(s) if len(s) else 0.0)
        .reset_index()
        .rename(columns={"Churn": "churn_rate"})
    )

    conn.close()

    return {
        "total_customers": int(total),
        "churn_rate_overall": float(churn_rate),
        "churn_rate_by_contract": [
            {"contract": row["Contract"], "churn_rate": float(row["churn_rate"])}
            for _, row in by_contract.iterrows()
        ],
        "churn_rate_by_payment_method": [
            {
                "payment_method": row["PaymentMethod"],
                "churn_rate": float(row["churn_rate"]),
            }
            for _, row in by_payment.iterrows()
        ],
    }
