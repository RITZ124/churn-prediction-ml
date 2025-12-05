import React, { useState } from "react";
import PredictForm from "./components/PredictForm";
import HistoryTable from "./components/HistoryTable";
import Insights from "./components/Insights";

const TABS = ["Predict", "History", "Insights"];

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState("Predict");
  const [lastPrediction, setLastPrediction] = useState(null);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Customer Churn Control Center</h1>
        <p style={styles.subtitle}>
          End-to-end churn prediction system with live risk scoring,
          history logging, and churn analytics.
        </p>

        <div style={styles.tabRow}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                ...styles.tab,
                ...(activeTab === t ? styles.tabActive : {}),
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={styles.content}>
          {activeTab === "Predict" && (
            <PredictForm
              apiUrl={API_URL}
              onPredicted={(p) => {
                setLastPrediction(p);
                setActiveTab("History");
              }}
            />
          )}
          {activeTab === "History" && (
            <HistoryTable apiUrl={API_URL} lastPrediction={lastPrediction} />
          )}
          {activeTab === "Insights" && <Insights apiUrl={API_URL} />}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    justifyContent: "center",
    padding: "24px",
    color: "#e5e7eb",
  },
  card: {
    width: "100%",
    maxWidth: "1100px",
    background:
      "radial-gradient(circle at top left, rgba(56,189,248,0.15), transparent 60%), radial-gradient(circle at bottom right, rgba(239,68,68,0.15), transparent 60%), #020617",
    borderRadius: "24px",
    padding: "24px 24px 32px",
    border: "1px solid #1e293b",
    boxShadow: "0 25px 60px rgba(15,23,42,0.9)",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "6px",
    marginBottom: "18px",
    fontSize: "13px",
    color: "#9ca3af",
  },
  tabRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "18px",
  },
  tab: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "999px",
    border: "1px solid #1f2937",
    background: "transparent",
    color: "#9ca3af",
    fontSize: "13px",
    cursor: "pointer",
  },
  tabActive: {
    background:
      "linear-gradient(135deg, rgba(129,140,248,0.25), rgba(248,113,113,0.35))",
    color: "#f9fafb",
    borderColor: "#4f46e5",
  },
  content: {
    marginTop: "4px",
  },
};
