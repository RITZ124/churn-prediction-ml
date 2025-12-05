import React, { useState } from "react";
import axios from "axios";

export default function PredictForm({ apiUrl, onPredicted }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready.");

  const [form, setForm] = useState({
    customerID: "TEST-0001",
    gender: "Female",
    SeniorCitizen: 0,
    Partner: "Yes",
    Dependents: "No",
    tenure: 1,
    PhoneService: "Yes",
    MultipleLines: "No",
    InternetService: "DSL",
    OnlineSecurity: "No",
    OnlineBackup: "Yes",
    DeviceProtection: "No",
    TechSupport: "No",
    StreamingTV: "No",
    StreamingMovies: "No",
    Contract: "Month-to-month",
    PaperlessBilling: "Yes",
    PaymentMethod: "Electronic check",
    MonthlyCharges: 70,
    TotalCharges: null,
  });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Predicting...");

    const payload = {
      ...form,
      SeniorCitizen: Number(form.SeniorCitizen),
      tenure: Number(form.tenure),
      MonthlyCharges: Number(form.MonthlyCharges),
      TotalCharges:
        form.TotalCharges === null || form.TotalCharges === ""
          ? null
          : Number(form.TotalCharges),
    };

    try {
      const res = await axios.post(`${apiUrl}/predict_churn`, payload);
      setStatus("Prediction successful.");
      onPredicted && onPredicted(res.data);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Predict Churn</h2>
      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
        Fill customer attributes and submit to estimate churn probability.
      </p>
      <form onSubmit={handleSubmit} style={gridStyles.grid}>
        {renderSelect("Gender", "gender", form.gender, handleChange, [
          "Female",
          "Male",
        ])}
        {renderSelect(
          "Senior Citizen",
          "SeniorCitizen",
          form.SeniorCitizen,
          handleChange,
          [
            { label: "No", value: 0 },
            { label: "Yes", value: 1 },
          ]
        )}
        {renderSelect("Partner", "Partner", form.Partner, handleChange, [
          "Yes",
          "No",
        ])}
        {renderSelect(
          "Dependents",
          "Dependents",
          form.Dependents,
          handleChange,
          ["No", "Yes"]
        )}
        {renderInput(
          "Tenure (months)",
          "tenure",
          form.tenure,
          handleChange,
          "number"
        )}
        {renderSelect(
          "Phone Service",
          "PhoneService",
          form.PhoneService,
          handleChange,
          ["Yes", "No"]
        )}
        {renderSelect(
          "Multiple Lines",
          "MultipleLines",
          form.MultipleLines,
          handleChange,
          ["No", "Yes", "No phone service"]
        )}
        {renderSelect(
          "Internet Service",
          "InternetService",
          form.InternetService,
          handleChange,
          ["DSL", "Fiber optic", "No"]
        )}
        {renderSelect(
          "Online Security",
          "OnlineSecurity",
          form.OnlineSecurity,
          handleChange,
          ["No", "Yes", "No internet service"]
        )}
        {renderSelect(
          "Online Backup",
          "OnlineBackup",
          form.OnlineBackup,
          handleChange,
          ["No", "Yes", "No internet service"]
        )}
        {renderSelect(
          "Device Protection",
          "DeviceProtection",
          form.DeviceProtection,
          handleChange,
          ["No", "Yes", "No internet service"]
        )}
        {renderSelect(
          "Tech Support",
          "TechSupport",
          form.TechSupport,
          handleChange,
          ["No", "Yes", "No internet service"]
        )}
        {renderSelect(
          "Streaming TV",
          "StreamingTV",
          form.StreamingTV,
          handleChange,
          ["No", "Yes", "No internet service"]
        )}
        {renderSelect(
          "Streaming Movies",
          "StreamingMovies",
          form.StreamingMovies,
          handleChange,
          ["No", "Yes", "No internet service"]
        )}
        {renderSelect("Contract", "Contract", form.Contract, handleChange, [
          "Month-to-month",
          "One year",
          "Two year",
        ])}
        {renderSelect(
          "Paperless Billing",
          "PaperlessBilling",
          form.PaperlessBilling,
          handleChange,
          ["Yes", "No"]
        )}
        {renderSelect(
          "Payment Method",
          "PaymentMethod",
          form.PaymentMethod,
          handleChange,
          [
            "Electronic check",
            "Mailed check",
            "Bank transfer (automatic)",
            "Credit card (automatic)",
          ]
        )}
        {renderInput(
          "Monthly Charges",
          "MonthlyCharges",
          form.MonthlyCharges,
          handleChange,
          "number"
        )}
        {renderInput(
          "Total Charges (optional)",
          "TotalCharges",
          form.TotalCharges ?? "",
          handleChange,
          "number"
        )}
        {renderInput(
          "Customer ID",
          "customerID",
          form.customerID,
          handleChange,
          "text"
        )}
      </form>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center" }}>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            background:
              "linear-gradient(135deg, #6366f1, #ec4899, #f97316)",
            color: "white",
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            marginRight: 10,
          }}
        >
          {loading ? "Predicting..." : "Predict Churn"}
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{status}</span>
      </div>
    </div>
  );
}

const gridStyles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px 14px",
  },
};

function renderInput(label, name, value, onChange, type = "text") {
  return (
    <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
      <label style={{ marginBottom: 2 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid #1f2937",
          background: "#020617",
          color: "#e5e7eb",
          fontSize: 12,
        }}
      />
    </div>
  );
}

function renderSelect(label, name, value, onChange, options) {
  const opts = options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
      <label style={{ marginBottom: 2 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid #1f2937",
          background: "#020617",
          color: "#e5e7eb",
          fontSize: 12,
        }}
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
