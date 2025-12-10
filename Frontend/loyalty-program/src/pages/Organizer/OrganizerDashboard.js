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

        console.log("Total events fetched:", eventsWithGuests.length);
        console.log("My events as organizer:", myEvents.length);
        console.log("My events details:", myEvents.map(e => ({
          name: e.name,
          published: e.published,
          guests: e.guests?.length || 0
        })));

        setEvents(myEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [user]);

  // Get the next upcoming event
  const nextEvent = events
    .filter((event) => new Date(event.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>Event Organizer Dashboard</h1>
        <p style={{ color: "#666" }}>
          Monitor your events and manage attendees.
        </p>
      </div>

      {/* Event Attendance Analytics and My Events Button - Side by Side */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Event Attendance Chart */}
        {!loading && events.length > 0 && (
          <div className="chart-card" style={{ paddingBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: "0" }}>
                <i className="fas fa-chart-bar" style={{ marginRight: "10px", color: "var(--color-brand-orange)" }}></i>
                My Events Attendance
              </h2>
              <div style={{ display: "flex", gap: "15px", fontSize: "11px", color: "var(--color-text-main)", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--color-brand-blue)", display: "inline-block" }}></span>
                  <span>Attending</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "rgba(200, 200, 200, 0.5)", display: "inline-block" }}></span>
                  <span>Available Spots</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--color-brand-red)", display: "inline-block" }}></span>
                  <span>Full (100%)</span>
                </div>
              </div>
            </div>
            <EventAttendanceChart events={events} />
          </div>
        )}

        {/* Right Column - My Events Button and Upcoming Events */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* My Events Button */}
          <Link to="/manager/events" className="manager-card card-content" style={{ height: "fit-content" }}>
            <div>
              <i className="fas fa-calendar-alt"></i>
              <h2>My Events</h2>
              <p>
                Create and manage events, track RSVPs, and award points to
                attendees.
              </p>
            </div>
          </Link>

          {/* Next Event - Flash Style */}
          {!loading && nextEvent && (
            <div style={{
              background: "var(--color-brand-blue)",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 4px 15px rgba(140, 228, 255, 0.4)",
            }}>
              <div style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                marginBottom: "0.75rem",
                color: "var(--color-brand-orange)",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                <i className="fas fa-bolt" style={{ marginRight: "8px" }}></i>
                Next Event
              </div>
              <h3 style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "var(--color-text-main)"
              }}>
                {nextEvent.name}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                <div>
                  <i className="fas fa-clock" style={{ marginRight: "8px", color: "var(--color-brand-orange)" }}></i>
                  {new Date(nextEvent.startTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
                {nextEvent.location && (
                  <div>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: "8px", color: "var(--color-brand-orange)" }}></i>
                    {nextEvent.location}
                  </div>
                )}
                <div>
                  <i className="fas fa-users" style={{ marginRight: "8px", color: "var(--color-brand-orange)" }}></i>
                  {nextEvent.guests?.length || 0}
                  {nextEvent.capacity ? ` / ${nextEvent.capacity}` : ''} attendees
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
