import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import EventAttendanceChart from "../../Components/Charts/EventAttendanceChart";
import "../Manager/Manager.css";
import "../User/UserDashboard.css"; // For chart-card styles

export default function SuperAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        // Fetch all events (published and unpublished for superusers)
        const data = await api.get(`/events?limit=100&page=1`);
        let fetchedEvents = data.results || [];

        // Fetch full details for events (with guest lists)
        const eventsWithGuests = await Promise.all(
          fetchedEvents.map(async (event) => {
            try {
              const fullEvent = await api.get(`/events/${event.id}`);
              return fullEvent;
            } catch (err) {
              return event;
            }
          })
        );

        setEvents(eventsWithGuests.filter(e => e !== null));
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>
          <i className="fas fa-user-shield"></i> Superuser Dashboard
        </h1>
        <p style={{ color: "#666" }}>
          Complete system control - monitor performance and manage all resources.
        </p>
      </div>

      {/* Event Attendance Analytics */}
      {!loading && events.length > 0 && (
        <div className="chart-card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: "0" }}>
              <i className="fas fa-chart-bar" style={{ marginRight: "10px", color: "#FFA239" }}></i>
              System-Wide Event Analytics
            </h2>
            <div style={{ display: "flex", gap: "15px", fontSize: "11px", color: "#333", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#8CE4FF", display: "inline-block" }}></span>
                <span>Attending</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "rgba(200, 200, 200, 0.5)", display: "inline-block" }}></span>
                <span>Available Spots</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5656", display: "inline-block" }}></span>
                <span>Full (100%)</span>
              </div>
            </div>
          </div>
          <EventAttendanceChart events={events} />
        </div>
      )}

      <div className="manager-dashboard-grid">
        {/* User Management */}
        <Link to="/manager/users" className="manager-card card-users">
          <div>
            <i className="fas fa-users-cog"></i>
            <h2>User Management</h2>
            <p>
              Verify accounts, manage roles (including manager/superuser), and handle suspicious users.
            </p>
          </div>
        </Link>

        {/* System Transactions */}
        <Link to="/manager/transactions" className="manager-card card-transactions">
          <div>
            <i className="fas fa-list-alt"></i>
            <h2>System Transactions</h2>
            <p>
              View complete history of all purchases, transfers, and redemptions across the system.
            </p>
          </div>
        </Link>

        {/* Events & Promotions */}
        <Link to="/manager/events" className="manager-card card-content">
          <div>
            <i className="fas fa-calendar-alt"></i>
            <h2>Events & Promotions</h2>
            <p>
              Full control over events, manage organizers, and publish promotional offers.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
