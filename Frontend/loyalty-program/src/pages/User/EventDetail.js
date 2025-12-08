import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import "./EventDetail.css";
import "./UserDashboard.css";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [isAttending, setIsAttending] = useState(false);

  // Fetch event details
  useEffect(() => {
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get(`/events/${eventId}`);

      // Transform guests array to have consistent structure
      // The API returns guest objects that already contain user data (id, name, utorid, email)
      // We need to format them to have a nested 'user' property and 'userId' for consistency
      if (data.guests && data.guests.length > 0) {
        data.guests = data.guests.map(guest => {
          // If guest already has a nested 'user' property, return as-is
          if (guest.user && guest.user.name) {
            return guest;
          }

          // Otherwise, restructure: the guest object IS the user data
          return {
            userId: guest.id, // The guest's id is the userId
            user: {
              id: guest.id,
              name: guest.name,
              utorid: guest.utorid,
              email: guest.email
            }
          };
        });
      }

      setEvent(data);

      // Check if current user is already attending
      // Note: API returns guest.id (not guest.userId) - the guest ID IS the user ID
      const userIsAttending = data.guests?.some(
        (guest) => guest.id === user?.id || guest.userId === user?.id
      );
      setIsAttending(userIsAttending);
    } catch (err) {
      setError(err.message || "Failed to load event details");
      console.error("Error fetching event:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle RSVP
  const handleRSVP = async () => {
    try {
      setRsvpLoading(true);

      // Save current scroll position
      const scrollPosition = window.scrollY;

      await api.post(`/events/${eventId}/guests/me`);

      // Refresh event details
      await fetchEventDetails();

      // Restore scroll position after render
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      alert(err.message || "Failed to RSVP. Please try again.");
      console.error("RSVP error:", err);
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle Cancel RSVP
  const handleCancelRSVP = async () => {
    if (!window.confirm("Are you sure you want to cancel your RSVP?")) {
      return;
    }

    try {
      setRsvpLoading(true);

      // Save current scroll position
      const scrollPosition = window.scrollY;

      await api.delete(`/events/${eventId}/guests/me`);

      // Refresh event details
      await fetchEventDetails();

      // Restore scroll position after render
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      alert(err.message || "Failed to cancel RSVP. Please try again.");
      console.error("Cancel RSVP error:", err);
    } finally {
      setRsvpLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if event is in the past
  const isPastEvent = () => {
    if (!event) return false;
    return new Date(event.endTime) < new Date();
  };

  // Check if event is full
  const isFull = () => {
    if (!event || !event.capacity) return false;
    return event.guests?.length >= event.capacity;
  };

  // Calculate spots remaining
  const spotsRemaining = () => {
    if (!event) return 0;
    if (!event.capacity) return "Unlimited";
    const remaining = event.capacity - (event.guests?.length || 0);
    return remaining > 0 ? remaining : 0;
  };

  // Show RSVP button conditions
  const canRSVP = () => {
    if (!event) return false;
    if (isAttending) return false;
    if (isPastEvent()) return false;
    if (isFull()) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin loading-icon"></i>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={fetchEventDetails}>
            Try Again
          </button>
          <button
            type="button"
            className="btn-back btn-back-spaced"
            onClick={() => navigate("/events")}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <i className="fas fa-calendar-times empty-icon"></i>
          <h3>Event not found</h3>
          <button type="button" className="btn-back" onClick={() => navigate("/events")}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Back Button */}
      <button type="button" className="btn-back-link" onClick={() => navigate("/events")}>
        <i className="fas fa-arrow-left"></i> Back to Events
      </button>

      <div className="event-detail-container">
        {/* Event Header */}
        <div className="event-detail-header">
          <div className="event-badges">
            {isPastEvent() && <span className="badge badge-past">Past Event</span>}
            {!isPastEvent() && <span className="badge badge-upcoming">Upcoming</span>}
            {isFull() && !isPastEvent() && (
              <span className="badge badge-full">Event Full</span>
            )}
            {isAttending && (
              <span className="badge badge-attending">You're Attending!</span>
            )}
          </div>

          <h1 className="event-detail-title">{event.name}</h1>

          <div className="event-meta">
            <div className="meta-item">
              <i className="fas fa-calendar-alt"></i>
              <span>{formatDate(event.startTime)}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-clock"></i>
              <span>
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </span>
            </div>
            <div className="meta-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Event Content Grid */}
        <div className="event-content-grid">
          {/* Main Content */}
          <div className="event-main-content">
            {/* Description */}
            <div className="content-section">
              <h3>
                <i className="fas fa-info-circle"></i> About This Event
              </h3>
              <p className="event-full-description">{event.description}</p>
            </div>

            {/* Organizers */}
            {event.organizers && event.organizers.length > 0 && (
              <div className="content-section">
                <h3>
                  <i className="fas fa-users-cog"></i> Organizers
                </h3>
                <div className="organizers-list">
                  {event.organizers.map((organizer) => (
                    <div key={organizer.userId} className="organizer-item">
                      <div className="organizer-avatar">
                        {organizer.user?.avatarUrl ? (
                          <img
                            src={organizer.user.avatarUrl}
                            alt={organizer.user.name}
                          />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="organizer-info">
                        <strong>{organizer.user?.name || "Unknown"}</strong>
                        <small>{organizer.user?.utorid}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendees */}
            {isAttending && event.guests && event.guests.length > 0 && (
              <div className="content-section">
                <h3>
                  <i className="fas fa-users"></i> Attendees ({event.guests.length}
                  {event.capacity && ` / ${event.capacity}`})
                </h3>
                <div className="attendees-grid">
                  {event.guests.map((guest) => (
                    <div key={guest.userId} className="attendee-item">
                      <i className="fas fa-user-circle"></i>
                      <span>{guest.user?.name || guest.user?.utorid}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="event-sidebar">
            {/* Event Stats Card */}
            <div className="stats-card">
              <h4>Event Details</h4>

              <div className="stat-item">
                <i className="fas fa-users"></i>
                <div>
                  <strong>Capacity</strong>
                  <p>
                    {event.capacity
                      ? `${event.guests?.length || 0} / ${event.capacity}`
                      : "Unlimited"}
                  </p>
                </div>
              </div>

              <div className="stat-item">
                <i className="fas fa-chair"></i>
                <div>
                  <strong>Spots Remaining</strong>
                  <p className={isFull() ? "text-danger" : "text-success"}>
                    {spotsRemaining()}
                  </p>
                </div>
              </div>

              <div className="stat-item">
                <i className="fas fa-star"></i>
                <div>
                  <strong>Points Reward</strong>
                  <p className="text-points">{event.points} points</p>
                </div>
              </div>

              <div className="stat-item">
                <i className="fas fa-gift"></i>
                <div>
                  <strong>Points Remaining</strong>
                  <p>{event.pointsRemain} points</p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="action-card">
              {isAttending ? (
                <>
                  <div className="rsvp-success">
                    <i className="fas fa-check-circle"></i>
                    <p>You're registered for this event!</p>
                  </div>
                  <button
                    type="button"
                    className="btn-cancel-rsvp"
                    onClick={handleCancelRSVP}
                    disabled={rsvpLoading || isPastEvent()}
                  >
                    {rsvpLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Canceling...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-times-circle"></i> Cancel RSVP
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {canRSVP() ? (
                    <button
                      type="button"
                      className="btn-rsvp"
                      onClick={handleRSVP}
                      disabled={rsvpLoading}
                    >
                      {rsvpLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> RSVP Now
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="rsvp-disabled">
                      {isPastEvent() && (
                        <p>
                          <i className="fas fa-clock"></i> This event has ended
                        </p>
                      )}
                      {isFull() && !isPastEvent() && (
                        <p>
                          <i className="fas fa-user-times"></i> Event is full
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
