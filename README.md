
# Customer Churn Prediction System (End-to-End ML + FastAPI + React)

Live Demo:  
- **Frontend (React UI):** https://churn-frontend-pgk3.onrender.com/  
- **Backend (FastAPI API):** https://churn-backend-7av6.onrender.com  

## 🔍 Overview

This project is a **production-style customer churn prediction system** built around the classic Telco Customer Churn dataset. It covers the full lifecycle:

- Exploratory Data Analysis (EDA) in Jupyter
- Feature engineering and model training (Logistic Regression / Random Forest)
- SQLite-based data storage for raw + feature-processed customers
- A FastAPI backend providing a `POST /predict_churn` inference endpoint
- Logging all predictions to a `predictions` table
- A React dashboard with:
  - Live prediction UI
  - Prediction history table
  - Churn insights (charts by contract type and payment method)

The goal is to simulate a **real ML product**, not just a notebook.

---

## 🧱 Tech Stack

**ML & Data:**
- Python, Pandas, NumPy
- scikit-learn
- Jupyter Notebooks

**Backend:**
- FastAPI
- Uvicorn
- SQLite (via `sqlite3`)
- Pydantic (input validation)

**Frontend:**
- React (Vite)
- Axios (API calls)
- Recharts (analytics charts)

**Deployment:**
- Render (Web Service for FastAPI backend)
- Render (Static Site for React frontend)

---

## 📁 Project Structure

bash
churn-prediction-ml/
├─ data/
│  ├─ raw/
│  │  └─ Telco-Customer-Churn.csv
│  └─ processed/
│     └─ processed_churn.csv
├─ notebooks/
│  ├─ 01_eda.ipynb
│  ├─ 02_feature_engineering.ipynb
│  └─ 03_modeling.ipynb
├─ src/
│  ├─ api.py          # FastAPI app (predict, history, stats)
│  ├─ config.py       # Basic config paths
│  ├─ data_prep.py    # DB init + feature pipeline → SQLite
│  └─ train.py        # Model training + artifact saving
├─ sql/
│  ├─ create_tables.sql
│  └─ queries.sql
├─ models/
│  └─ best_model.pkl  # model + scaler + feature metadata
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  └─ components/
│  │      ├─ PredictForm.jsx
│  │      ├─ HistoryTable.jsx
│  │      └─ Insights.jsx
│  └─ .env (VITE_API_URL)
├─ churn.db           # SQLite database (raw, features, predictions)
├─ requirements.txt
└─ README.md

🧪 Data & ML Pipeline
1. EDA (notebooks/01_eda.ipynb)

Inspected schema, missing values, distributions

Visualized:

Churn vs Non-Churn counts

Tenure, MonthlyCharges distributions

Churn rate by Contract type and Payment method

Documented key insights in Markdown cells

2. Feature Engineering (notebooks/02_feature_engineering.ipynb)

Key steps:

Cleaned TotalCharges (string → numeric with median imputation for invalid entries)

Dropped customerID from model features (but kept it as an identifier elsewhere)

Encoded Churn as binary (Yes → 1, No → 0)

Created derived features:

tenure_group (0–6, 6–12, 12–24, 24–48, 48+ months)

total_services (count of subscribed services across multiple columns)

is_long_term (contracts that are not month-to-month)

One-hot encoded all categorical variables using pd.get_dummies

Saved final processed dataset to:

data/processed/processed_churn.csv

3. Modeling (notebooks/03_modeling.ipynb and src/train.py)

Split into train / test (80/20, stratified)

Standardized numeric features:

tenure, MonthlyCharges, TotalCharges, total_services

Trained:

Logistic Regression

Random Forest

Evaluated each using:

Accuracy, Precision, Recall, F1

ROC-AUC

Selected the best model based on ROC-AUC

Saved an artifact dictionary to models/best_model.pkl:

{
  "model": best_model,
  "scaler": StandardScaler(),
  "feature_cols": [...],
  "numeric_cols": ["tenure", "MonthlyCharges", "TotalCharges", "total_services"]
}


This artifact is used directly by the FastAPI backend for consistent preprocessing.
🗄️ Database Design (SQLite)

All data is stored in churn.db at the project root.

Tables:

customers_raw

Direct import of Telco-Customer-Churn.csv

customers_features

Fully feature-engineered + one-hot encoded table, aligned with model features

predictions

Stores every API call:

id (auto)

customerID

churn_probability

risk_label (LOW/MEDIUM/HIGH)

predicted_at (timestamp)

Database is created and populated via:

python src/data_prep.py

🌐 Backend: FastAPI Service

Entry point: src/api.py

Endpoints:

GET /

Health check.

Response:

{ "status": "ok", "message": "Churn prediction API is running" }

POST /predict_churn

Takes raw customer fields (similar to Telco dataset schema), performs:

Feature engineering (tenure_group, total_services, is_long_term)

One-hot encoding aligned with training

Scaling of numeric features using trained StandardScaler

Model inference → churn probability

Risk banding: LOW / MEDIUM / HIGH

Writes the prediction into predictions table in SQLite

Example request:

{
  "customerID": "TEST-0001",
  "gender": "Female",
  "SeniorCitizen": 0,
  "Partner": "Yes",
  "Dependents": "No",
  "tenure": 1,
  "PhoneService": "No",
  "MultipleLines": "No phone service",
  "InternetService": "DSL",
  "OnlineSecurity": "No",
  "OnlineBackup": "Yes",
  "DeviceProtection": "No",
  "TechSupport": "No",
  "StreamingTV": "No",
  "StreamingMovies": "No",
  "Contract": "Month-to-month",
  "PaperlessBilling": "Yes",
  "PaymentMethod": "Electronic check",
  "MonthlyCharges": 29.85,
  "TotalCharges": 29.85
}


Example response:

{
  "customerID": "TEST-0001",
  "churn_probability": 0.87,
  "risk_label": "HIGH"
}

GET /predictions

Returns recent predictions from the predictions table.

Query param: limit (default 50)

Example:

GET /predictions?limit=20


Response:

{
  "items": [
    {
      "id": 123,
      "customerID": "TEST-0001",
      "churn_probability": 0.87,
      "risk_label": "HIGH",
      "predicted_at": "2025-12-05 07:10:22"
    },
    ...
  ]
}

GET /stats/churn

Returns churn analytics computed from customers_raw:

Overall churn rate

Churn by contract type

Churn by payment method

Response (shape):

{
  "total_customers": 7043,
  "churn_rate_overall": 0.265,
  "churn_rate_by_contract": [
    { "contract": "Month-to-month", "churn_rate": 0.43 },
    { "contract": "One year", "churn_rate": 0.11 },
    { "contract": "Two year", "churn_rate": 0.03 }
  ],
  "churn_rate_by_payment_method": [
    { "payment_method": "Electronic check", "churn_rate": 0.45 },
    ...
  ]
}

🎨 Frontend: React Dashboard (Vite)

Located in frontend/.
Key components:

App.jsx

Tabbed layout:

Predict

History

Insights

Reads backend URL from VITE_API_URL env variable.

PredictForm.jsx

Rich form for capturing customer attributes (gender, contract, services, charges, etc.)

Calls POST /predict_churn on submit

Shows request status and automatically switches to History tab after prediction.

HistoryTable.jsx

Calls GET /predictions?limit=50

Shows a scrollable table of recent predictions:

ID, Customer ID, Probability %, Risk Label, Timestamp

Insights.jsx

Calls GET /stats/churn

Renders:

Bar chart of churn by contract

Bar chart of churn by payment method

Uses Recharts for data visualization.

💻 Local Development
1. Clone Repo
git clone https://github.com/YOUR_USERNAME/churn-prediction-ml.git
cd churn-prediction-ml

2. Python Backend (FastAPI)

Create and activate a virtual environment:

python -m venv venv
.\venv\Scripts\Activate   # Windows
# source venv/bin/activate  # Linux/Mac


Install dependencies and prepare data/model:

pip install -r requirements.txt
python src/data_prep.py
python src/train.py


Run backend:

uvicorn src.api:app --reload


Backend will run on http://127.0.0.1:8000.

Open docs:

http://127.0.0.1:8000/docs

3. React Frontend
cd frontend
npm install


Create .env for local dev:

VITE_API_URL=http://127.0.0.1:8000


Run dev server:

npm run dev -- --host 0.0.0.0 --port 5173


Open:

http://127.0.0.1:5173

🚀 Deployment (Render)
Backend (Web Service)

Service type: Web Service

Runtime: Python 3

Build Command:

pip install -r requirements.txt
python src/data_prep.py
python src/train.py


Start Command:

uvicorn src.api:app --host 0.0.0.0 --port 10000


PORT: 10000

Result (example):

https://churn-backend-7av6.onrender.com

Frontend (Static Site)

Service type: Static Site

Root Directory: frontend

Build Command:

npm install
npm run build


Publish Directory: dist

Environment Variable:

VITE_API_URL = https://churn-backend-7av6.onrender.com


Result (example):

https://churn-frontend-pgk3.onrender.com/

🧩 Future Improvements

Add authentication & role-based access (e.g., analyst vs. manager)

Add more model monitoring: drift detection, calibration plots

Integrate a real relational database (PostgreSQL) instead of SQLite

Add A/B testing between multiple models

Implement a feature importance / explainability panel (SHAP)








