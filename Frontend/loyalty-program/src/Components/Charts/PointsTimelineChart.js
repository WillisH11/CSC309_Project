import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PointsTimelineChart({ transactions, currentPoints }) {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Sort transactions by date (oldest first)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Calculate cumulative points over time
    let cumulativePoints = currentPoints;
    const dataPoints = [];
    const labels = [];

    // Work backwards from current points to reconstruct the timeline
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
      const tx = sortedTransactions[i];
      const date = new Date(tx.createdAt);
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      labels.unshift(label);
      dataPoints.unshift(cumulativePoints);

      // Subtract this transaction to get previous balance
      const txAmount =
        tx.type === "redemption" ? -tx.redeemed : tx.amount || 0;
      cumulativePoints -= txAmount;
    }

    // Add current balance at the end
    const now = new Date();
    labels.push(
      now.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    dataPoints.push(currentPoints);

    return {
      labels,
      datasets: [
        {
          label: "Points Balance",
          data: dataPoints,
          borderColor: "#FFA239",
          backgroundColor: "rgba(255, 162, 57, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#FFA239",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [transactions, currentPoints]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#FFA239",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `${context.parsed.y} points`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#666",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#666",
          callback: function (value) {
            return value + " pts";
          },
        },
      },
    },
  };

  if (!chartData) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#999",
          fontStyle: "italic",
        }}
      >
        No transaction history to display
      </div>
    );
  }

  return (
    <div style={{ height: "200px", position: "relative" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
