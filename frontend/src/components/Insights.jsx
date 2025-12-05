import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Insights({ apiUrl }) {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("Loading churn stats...");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${apiUrl}/stats/churn`);
        setStats(res.data);
        setStatus("Churn analytics loaded.");
      } catch (err) {
        console.error(err);
        setStatus("Failed to load churn stats.");
      }
    };
    load();
  }, [apiUrl]);

  if (!stats) {
    return (
      <div>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Churn Insights</h2>
        <p style={{ fontSize: 12, color: "#9ca3af" }}>{status}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Churn Insights</h2>
      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
        {status} | Total customers in dataset: {stats.total_customers} | Overall churn:{" "}
        {(stats.churn_rate_overall * 100).toFixed(1)}%
      </p>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        <div style={card}>
          <h3 style={cardTitle}>Churn by Contract Type</h3>
          <ChartContainer>
            <BarChart
              data={stats.churn_rate_by_contract.map((d) => ({
                ...d,
                churn_pct: d.churn_rate * 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="contract" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(v) => v + "%"}
              />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(value) => value.toFixed(1) + "%"}
              />
              <Bar dataKey="churn_pct" />
            </BarChart>
          </ChartContainer>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Churn by Payment Method</h3>
          <ChartContainer>
            <BarChart
              data={stats.churn_rate_by_payment_method.map((d) => ({
                ...d,
                churn_pct: d.churn_rate * 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="payment_method"
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(v) => v + "%"}
              />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(value) => value.toFixed(1) + "%"}
              />
              <Bar dataKey="churn_pct" />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}

function ChartContainer({ children }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  );
}

const card = {
  backgroundColor: "#020617",
  borderRadius: 16,
  padding: 12,
  border: "1px solid #1f2937",
};

const cardTitle = {
  fontSize: 13,
  marginBottom: 8,
};
