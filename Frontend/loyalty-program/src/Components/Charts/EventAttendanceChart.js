import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function EventAttendanceChart({ events }) {
  const chartData = useMemo(() => {
    if (!events || events.length === 0) {
      return null;
    }

    // Sort events by attendance (highest first) and take top 8
    const sortedEvents = [...events]
      .filter((e) => e.published) // Only show published events
      .sort((a, b) => {
        const attendanceA = a.guests?.length || 0;
        const attendanceB = b.guests?.length || 0;
        return attendanceB - attendanceA;
      })
      .slice(0, 8);

    if (sortedEvents.length === 0) {
      return null;
    }

    const labels = sortedEvents.map((event) => {
      // Truncate long event names
      const name = event.name || "Untitled Event";
      return name.length > 20 ? name.substring(0, 20) + "..." : name;
    });

    const attendanceData = sortedEvents.map((event) => event.guests?.length || 0);
    const capacityData = sortedEvents.map((event) => {
      const attendance = event.guests?.length || 0;
      if (!event.capacity) {
        // For unlimited capacity, show attendance + 20% buffer
        return Math.max(attendance * 1.2, attendance + 5);
      }
      return event.capacity - attendance;
    });

    // Determine bar colors based on fill percentage
    const backgroundColor = sortedEvents.map((event) => {
      if (!event.capacity) return "#8CE4FF"; // Unlimited capacity = blue
      const percentage = ((event.guests?.length || 0) / event.capacity) * 100;
      if (percentage >= 100) return "#FF5656"; // Full = red
      if (percentage >= 80) return "#FEEE91"; // Almost full = yellow
      return "#8CE4FF"; // Available = blue
    });

    return {
      labels,
      datasets: [
        {
          label: "Attending",
          data: attendanceData,
          backgroundColor,
          borderColor: backgroundColor.map((color) => color),
          borderWidth: 2,
        },
        {
          label: "Available Spots",
          data: capacityData,
          backgroundColor: "rgba(200, 200, 200, 0.3)",
          borderColor: "rgba(200, 200, 200, 0.5)",
          borderWidth: 1,
        },
        // Legend-only item for full events
        {
          label: "Full (100%)",
          data: [],
          backgroundColor: "#FF5656",
          borderColor: "#FF5656",
          borderWidth: 2,
        },
      ],
    };
  }, [events]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 0,
      },
    },
    plugins: {
      legend: {
        display: false, // Hide default legend
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#FFA239",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "#666",
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#666",
          stepSize: 10,
        },
        title: {
          display: true,
          text: "Number of Guests",
          color: "#333",
          font: {
            size: 12,
            weight: "bold",
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
        No events to display
      </div>
    );
  }

  return (
    <div style={{ height: "250px", position: "relative" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
