import React from "react";
import { Link } from "react-router-dom";
import "./UserDashboard.css";

export default function Rewards() {
  return (
    <div className="dashboard-container">
      <div
        className="balance-card"
        style={{ background: "#FFA239", borderColor: "#e58e2e" }}
      >
        <h1>Rewards Center</h1>
        <p style={{ color: "white" }}>Earn points and claim your rewards!</p>
      </div>

      <div className="actions-grid">
        <Link to="/promotions" className="action-card">
          <div className="action-icon">
            <i className="fas fa-tags"></i>
          </div>
          <h3>Promotions</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            Special offers & deals
          </p>
        </Link>

        <Link to="/events" className="action-card">
          <div className="action-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <h3>Events</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            RSVP to earn points
          </p>
        </Link>

        <Link to="/redeem" className="action-card">
          <div className="action-icon">
            <i className="fas fa-gift"></i>
          </div>
          <h3>Redeem Points</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>Claim your prizes</p>
        </Link>
      </div>
    </div>
  );
}
