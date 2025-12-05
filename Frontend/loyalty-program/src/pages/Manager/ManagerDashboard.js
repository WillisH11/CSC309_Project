import React from "react";
import { Link } from "react-router-dom";
import "./Manager.css"; // <--- Import the CSS

export default function ManagerDashboard() {
  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>Management Overview</h1>
        <p style={{ color: "#666" }}>
          Select a module to manage system resources.
        </p>
      </div>

      <div className="manager-dashboard-grid">
        <Link to="/manager/users" className="manager-card card-users">
          <div>
            <i className="fas fa-users-cog"></i>
            <h2>User Management</h2>
            <p>
              Verify new accounts, flag suspicious users, and update user
              details.
            </p>
          </div>
        </Link>

        <Link
          to="/manager/transactions"
          className="manager-card card-transactions"
        >
          <div>
            <i className="fas fa-list-alt"></i>
            <h2>System Transactions</h2>
            <p>
              View the full history of all purchases, transfers, and
              redemptions.
            </p>
          </div>
        </Link>

        <Link to="/manager/events" className="manager-card card-content">
          <div>
            <i className="fas fa-calendar-alt"></i>
            <h2>Events & Promotions</h2>
            <p>
              Create new events, manage RSVPs, and publish promotional offers.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
