import React, { useEffect, useState } from "react";
import axios from "axios";

export default function HistoryTable({ apiUrl, lastPrediction }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Loading history...");

  const load = async () => {
    try {
      const res = await axios.get(`${apiUrl}/predictions?limit=50`);
      setItems(res.data.items || []);
      setStatus(`Showing ${res.data.items?.length || 0} recent predictions.`);
    } catch (err) {
      console.error(err);
      setStatus("Failed to load predictions.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (lastPrediction) {
      load();
    }
  }, [lastPrediction]);

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Prediction History</h2>
      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
        {status}
      </p>
      <div
        style={{
          maxHeight: 350,
          overflow: "auto",
          borderRadius: 12,
          border: "1px solid #1f2937",
          backgroundColor: "#020617",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#0b1120",
                position: "sticky",
                top: 0,
              }}
            >
              <th style={th}>ID</th>
              <th style={th}>Customer ID</th>
              <th style={th}>Churn Prob</th>
              <th style={th}>Risk</th>
              <th style={th}>Predicted At</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td style={td}>{row.id}</td>
                <td style={td}>{row.customerID}</td>
                <td style={td}>{(row.churn_probability * 100).toFixed(1)}%</td>
                <td style={{ ...td, ...riskStyle(row.risk_label) }}>
                  {row.risk_label}
                </td>
                <td style={td}>{row.predicted_at}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td style={td} colSpan={5}>
                  No predictions yet. Run a prediction first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #111827",
  position: "sticky",
  top: 0,
};

const td = {
  padding: "6px 10px",
  borderBottom: "1px solid #111827",
};

function riskStyle(label) {
  if (label === "HIGH") {
    return { color: "#fca5a5" };
  }
  if (label === "MEDIUM") {
    return { color: "#facc15" };
  }
  return { color: "#4ade80" };
}
