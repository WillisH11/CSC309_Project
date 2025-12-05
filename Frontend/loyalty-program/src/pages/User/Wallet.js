import React from "react";
import { Link } from "react-router-dom";
import "./UserDashboard.css";

export default function Wallet() {
  return (
    <div className="dashboard-container">
      <div className="balance-card">
        <h1>My Wallet</h1>
        <p style={{ color: "white" }}>
          Manage your points, transfers, and history.
        </p>
      </div>

      <div className="actions-grid">
        {/* Link 1: My QR */}
        <Link to="/my-qr" className="action-card">
          <div className="action-icon">
            <i className="fas fa-qrcode"></i>
          </div>
          <h3>My QR Code</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            Show this to cashiers
          </p>
        </Link>

        {/* Link 2: Transfer */}
        <Link to="/transfer" className="action-card">
          <div className="action-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <h3>Transfer Points</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            Send points to friends
          </p>
        </Link>

        {/* Link 3: Transactions */}
        <Link to="/transactions" className="action-card">
          <div className="action-icon">
            <i className="fas fa-history"></i>
          </div>
          <h3>Transaction History</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            View past activity
          </p>
        </Link>
      </div>
    </div>
  );
}
