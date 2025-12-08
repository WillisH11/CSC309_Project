import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import "./Events.css";
import "./UserDashboard.css";

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  // Get filter and page from URL (for bookmarkable URLs)
  const currentFilter = searchParams.get("filter") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Fetch events
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, currentPage]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // For "My Events", fetch all events with guest details
      if (currentFilter === "myevents") {
        const data = await api.get(`/events?limit=100&page=1&published=true`);
        let allEvents = data.results || [];

        // Fetch full details for each event to get guest lists
        const eventsWithGuests = await Promise.all(
          allEvents.map(async (event) => {
            try {
              const fullEvent = await api.get(`/events/${event.id}`);
              return fullEvent;
            } catch (err) {
              console.error(`Failed to fetch event ${event.id}:`, err);
              return null;
            }
          })
        );

        // Filter to only events where current user is attending
        const myEvents = eventsWithGuests.filter(
          (event) =>
            event &&
            event.guests?.some((guest) => guest.id === user?.id)
        );

        // Manually paginate
        const startIdx = (currentPage - 1) * 4;
        const endIdx = startIdx + 4;
        const paginatedEvents = myEvents.slice(startIdx, endIdx);
        const totalPagesCalc = Math.ceil(myEvents.length / 4);

        setEvents(paginatedEvents);
        setTotalPages(totalPagesCalc);
      } else {
        // Normal flow for other filters
        // Fetch all published events
        const data = await api.get(`/events?limit=100&page=1&published=true`);
        let allEvents = data.results || [];

        // Filter events client-side based on filter selection
        let filteredEvents = allEvents;

        if (currentFilter === "upcoming") {
          filteredEvents = allEvents.filter(
            (event) => new Date(event.startTime) > new Date()
          );
        } else if (currentFilter === "past") {
          filteredEvents = allEvents.filter(
            (event) => new Date(event.endTime) < new Date()
          );
        }

        // Manually paginate the filtered results
        const startIdx = (currentPage - 1) * 4;
        const endIdx = startIdx + 4;
        const paginatedEvents = filteredEvents.slice(startIdx, endIdx);
        const totalPagesCalc = Math.ceil(filteredEvents.length / 4);

        // Fetch full details for paginated events to get guest lists
        // This allows us to show "Attending" badge on events
        const eventsWithGuests = await Promise.all(
          paginatedEvents.map(async (event) => {
            try {
              const fullEvent = await api.get(`/events/${event.id}`);
              return fullEvent;
            } catch (err) {
              console.error(`Failed to fetch event ${event.id}:`, err);
              return event; // Return original if fetch fails
            }
          })
        );

        setEvents(eventsWithGuests);
        setTotalPages(totalPagesCalc);
      }
    } catch (err) {
      setError(err.message || "Failed to load events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update URL when filter changes
  const handleFilterChange = (newFilter) => {
    setSearchParams({ filter: newFilter, page: "1" });
  };

  // Update URL when page changes
  const handlePageChange = (newPage) => {
    setSearchParams({ filter: currentFilter, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if event is in the past
  const isPastEvent = (event) => {
    return new Date(event.endTime) < new Date();
  };

  // Check if event is upcoming
  const isUpcoming = (event) => {
    return new Date(event.startTime) > new Date();
  };

  // Check if event is full
  const isFull = (event) => {
    if (!event.capacity) return false; // Unlimited capacity
    return event.guests?.length >= event.capacity;
  };

  // Calculate spots remaining
  const spotsRemaining = (event) => {
    if (!event.capacity) return "Unlimited";
    const remaining = event.capacity - (event.guests?.length || 0);
    return remaining > 0 ? remaining : 0;
  };

  // Check if current user is attending an event
  const isUserAttending = (event) => {
    if (!user || !event.guests) return false;
    return event.guests.some((guest) => guest.id === user.id || guest.userId === user.id);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="events-header">
        <h1 className="page-title">Upcoming Events</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
          Join events to earn points and connect with the community!
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${currentFilter === "all" ? "active" : ""}`}
          onClick={() => handleFilterChange("all")}
        >
          <i className="fas fa-list"></i> All Events
        </button>
        <button
          className={`filter-tab ${
            currentFilter === "myevents" ? "active" : ""
          }`}
          onClick={() => handleFilterChange("myevents")}
        >
          <i className="fas fa-calendar-check"></i> My Events
        </button>
        <button
          className={`filter-tab ${
            currentFilter === "upcoming" ? "active" : ""
          }`}
          onClick={() => handleFilterChange("upcoming")}
        >
          <i className="fas fa-calendar-plus"></i> Upcoming
        </button>
        <button
          className={`filter-tab ${currentFilter === "past" ? "active" : ""}`}
          onClick={() => handleFilterChange("past")}
        >
          <i className="fas fa-history"></i> Past Events
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem" }}></i>
          <p>Loading events...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchEvents}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-calendar-times" style={{ fontSize: "3rem" }}></i>
          <h3>No events found</h3>
          <p>
            {currentFilter === "myevents"
              ? "You haven't RSVPed to any events yet. Browse events and RSVP to get started!"
              : currentFilter === "upcoming"
              ? "There are no upcoming events at the moment."
              : currentFilter === "past"
              ? "No past events to display."
              : "No events available."}
          </p>
        </div>
      )}

      {/* Events Grid */}
      {!loading && !error && events.length > 0 && (
        <>
          <div className="events-grid">
            {events.map((event) => (
              <div
                key={event.id}
                className="event-card"
                onClick={() => navigate(`/events/${event.id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* Status Badges */}
                <div className="event-badges">
                  {isUserAttending(event) && (
                    <span className="badge badge-attending">Attending</span>
                  )}
                  {isPastEvent(event) && (
                    <span className="badge badge-past">Past</span>
                  )}
                  {isUpcoming(event) && (
                    <span className="badge badge-upcoming">Upcoming</span>
                  )}
                  {isFull(event) && isUpcoming(event) && (
                    <span className="badge badge-full">Full</span>
                  )}
                  {!event.published && (
                    <span className="badge badge-draft">Draft</span>
                  )}
                </div>

                {/* Event Name */}
                <h3 className="event-name">{event.name}</h3>

                {/* Event Description */}
                <p className="event-description">
                  {event.description?.substring(0, 100)}
                  {event.description?.length > 100 && "..."}
                </p>

                {/* Event Details */}
                <div className="event-details">
                  {/* Date & Time */}
                  <div className="event-detail-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(event.startTime)}</span>
                  </div>

                  <div className="event-detail-item">
                    <i className="fas fa-clock"></i>
                    <span>
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="event-detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{event.location}</span>
                  </div>

                  {/* Capacity */}
                  <div className="event-detail-item">
                    <i className="fas fa-users"></i>
                    <span>
                      {event.capacity
                        ? `${spotsRemaining(event)} spots left`
                        : "Unlimited capacity"}
                    </span>
                  </div>

                  {/* Points */}
                  <div className="event-detail-item event-points">
                    <i className="fas fa-star"></i>
                    <span className="points-value">{event.points} points</span>
                  </div>
                </div>

                {/* View Details Button */}
                <button className="btn-view-details">
                  View Details <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>

              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
