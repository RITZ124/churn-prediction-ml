-- SQL schema for churn prediction project (SQLite)

CREATE TABLE IF NOT EXISTS customers_raw (
    customerID TEXT PRIMARY KEY,
    gender TEXT,
    SeniorCitizen INTEGER,
    Partner TEXT,
    Dependents TEXT,
    tenure INTEGER,
    PhoneService TEXT,
    MultipleLines TEXT,
    InternetService TEXT,
    OnlineSecurity TEXT,
    OnlineBackup TEXT,
    DeviceProtection TEXT,
    TechSupport TEXT,
    StreamingTV TEXT,
    StreamingMovies TEXT,
    Contract TEXT,
    PaperlessBilling TEXT,
    PaymentMethod TEXT,
    MonthlyCharges REAL,
    TotalCharges TEXT,
    Churn TEXT
);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerID TEXT,
    churn_probability REAL,
    risk_label TEXT,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
