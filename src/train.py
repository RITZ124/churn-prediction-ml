from pathlib import Path
import pickle

import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "processed_churn.csv"
MODEL_PATH = BASE_DIR / "models" / "best_model.pkl"


def evaluate_model(name, y_true, y_pred, y_prob):
    print(f"----- {name} -----")
    print("Accuracy:", accuracy_score(y_true, y_pred))
    print("Precision:", precision_score(y_true, y_pred))
    print("Recall:", recall_score(y_true, y_pred))
    print("F1 Score:", f1_score(y_true, y_pred))
    print("ROC-AUC:", roc_auc_score(y_true, y_prob))
    print()
    return roc_auc_score(y_true, y_prob)


def main():
    print("Loading processed data from:", DATA_PATH)
    df = pd.read_csv(DATA_PATH)

    X = df.drop("Churn", axis=1)
    y = df["Churn"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    numeric_cols = ["tenure", "MonthlyCharges", "TotalCharges", "total_services"]

    # scale numeric columns
    scaler = StandardScaler()
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()

    X_train_scaled[numeric_cols] = scaler.fit_transform(X_train[numeric_cols])
    X_test_scaled[numeric_cols] = scaler.transform(X_test[numeric_cols])

    feature_cols = X.columns.tolist()

    # Logistic Regression
    log_model = LogisticRegression(max_iter=500)
    log_model.fit(X_train_scaled, y_train)
    log_pred = log_model.predict(X_test_scaled)
    log_prob = log_model.predict_proba(X_test_scaled)[:, 1]
    log_auc = evaluate_model("Logistic Regression", y_test, log_pred, log_prob)

    # Random Forest
    rf_model = RandomForestClassifier(n_estimators=200, random_state=42)
    rf_model.fit(X_train_scaled, y_train)
    rf_pred = rf_model.predict(X_test_scaled)
    rf_prob = rf_model.predict_proba(X_test_scaled)[:, 1]
    rf_auc = evaluate_model("Random Forest", y_test, rf_pred, rf_prob)

    # choose best by ROC-AUC
    scores = {
        "logistic": (log_model, log_auc),
        "random_forest": (rf_model, rf_auc),
    }

    best_name, (best_model, best_auc) = max(scores.items(), key=lambda x: x[1][1])
    print("Best model:", best_name, "with ROC-AUC:", best_auc)

    artifact = {
        "model": best_model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "numeric_cols": numeric_cols,
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(artifact, f)

    print("Saved model artifact to:", MODEL_PATH)


if __name__ == "__main__":
    main()
