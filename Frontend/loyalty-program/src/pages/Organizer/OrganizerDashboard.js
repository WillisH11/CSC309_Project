import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import EventAttendanceChart from "../../Components/Charts/EventAttendanceChart";
import "../Manager/Manager.css";
import "../User/UserDashboard.css"; // For chart-card styles

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        // Fetch all events
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

        // Filter to only events where current user is an organizer
        const myEvents = eventsWithGuests.filter(
          (event) =>
            event &&
            event.organizers?.some((org) => org.userId === user?.id || org.id === user?.id)
        );

        setEvents(myEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [user]);

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>Event Organizer Dashboard</h1>
        <p style={{ color: "#666" }}>
          Monitor your events and manage attendees.
        </p>
      </div>

      {/* Event Attendance Analytics for Organizer's Events */}
      {!loading && events.length > 0 && (
        <div className="chart-card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: "0" }}>
              <i className="fas fa-chart-bar" style={{ marginRight: "10px", color: "#FFA239" }}></i>
              My Events Attendance
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
