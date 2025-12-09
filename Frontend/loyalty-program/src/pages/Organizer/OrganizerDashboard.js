import React from "react";
import { Link } from "react-router-dom";
import "../Manager/Manager.css";

export default function OrganizerDashboard() {
  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>Event Organizer Dashboard</h1>
        <p style={{ color: "#666" }}>
          Manage your events and view event details.
        </p>
      </div>

      <div className="manager-dashboard-grid">
        <Link to="/manager/events" className="manager-card card-content">
          <div>
            <i className="fas fa-calendar-alt"></i>
            <h2>My Events</h2>
            <p>
              Create and manage events, track RSVPs, and award points to
              attendees.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
