import React, { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PointsBreakdownChart({ transactions }) {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Calculate points by transaction type (only positive gains)
    const breakdown = {
      purchase: 0,
      event: 0,
      transfer: 0,
      adjustment: 0,
    };

    transactions.forEach((tx) => {
      const points = tx.type === "redemption" ? 0 : tx.amount || 0;
      if (points > 0 && breakdown.hasOwnProperty(tx.type)) {
        breakdown[tx.type] += points;
      }
    });

    // Filter out zero values
    const labels = [];
    const data = [];
    const backgroundColor = [];
    const hoverBackgroundColor = [];

    const colorMap = {
      purchase: { bg: "#FFA239", hover: "#FF8C00" },
      event: { bg: "#8CE4FF", hover: "#6BCFEB" },
      transfer: { bg: "#FEEE91", hover: "#FDE047" },
      adjustment: { bg: "#FF5656", hover: "#DC2626" },
    };

    const labelMap = {
      purchase: "Purchases",
      event: "Events",
      transfer: "Transfers In",
      adjustment: "Adjustments",
    };

    Object.entries(breakdown).forEach(([type, points]) => {
      if (points > 0) {
        labels.push(labelMap[type]);
        data.push(points);
        backgroundColor.push(colorMap[type].bg);
        hoverBackgroundColor.push(colorMap[type].hover);
      }
    });

    if (data.length === 0) {
      return null;
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          hoverBackgroundColor,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };
  }, [transactions]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "#333",
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#FFA239",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} pts (${percentage}%)`;
          },
        },
      },
    },
    cutout: "65%",
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
        No earnings data to display
      </div>
    );
  }

  return (
    <div style={{ height: "200px", position: "relative" }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
