import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Manager.css";
import "./ManagerEvents.css";

export default function ManagerEvents() {
  const navigate = useNavigate();

  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting
  const [sortBy, setSortBy] = useState("date"); // "name", "status", "date"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"

  // Filtering
  const [filter, setFilter] = useState("all"); // "all", "published", "draft"

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form data for create/edit
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    capacity: "",
    points: "",
    published: true,
  });

  // Organizer management
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch events
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, sortOrder, filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events based on filter
      let allEvents = [];

      if (filter === "all") {
        // Fetch both published and unpublished
        const [publishedData, unpublishedData] = await Promise.all([
          api.get(`/events?limit=100&page=1&published=true`),
          api.get(`/events?limit=100&page=1&published=false`)
        ]);
        allEvents = [
          ...(publishedData.results || []),
          ...(unpublishedData.results || [])
        ];
      } else if (filter === "published") {
        // Fetch only published
        const data = await api.get(`/events?limit=100&page=1&published=true`);
        allEvents = data.results || [];
      } else if (filter === "draft") {
        // Fetch only unpublished
        const data = await api.get(`/events?limit=100&page=1&published=false`);
        allEvents = data.results || [];
      }

      // Sort events based on current sort settings
      const sortedEvents = sortEvents(allEvents, sortBy, sortOrder);

      // Paginate manually
      const startIdx = (currentPage - 1) * 10;
      const endIdx = startIdx + 10;
      const paginatedEvents = sortedEvents.slice(startIdx, endIdx);
      const totalPagesCalc = Math.ceil(sortedEvents.length / 10);

      setEvents(paginatedEvents);
      setTotalPages(totalPagesCalc);
    } catch (err) {
      setError(err.message || "Failed to load events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for organizer assignment
  const fetchUsers = async () => {
    try {
      const data = await api.get("/users?limit=100");
      setAvailableUsers(data.results || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Handle Create Event
  const handleCreate = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      startTime: "",
      endTime: "",
      capacity: "",
      points: "",
      published: true,
    });
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        points: parseInt(formData.points),
      };

      await api.post("/events", payload);
      alert("Event created successfully!");
      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.message || "Failed to create event");
    }
  };

  // Handle Edit Event
  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: formatDateTimeForInput(event.startTime),
      endTime: formatDateTimeForInput(event.endTime),
      capacity: event.capacity || "",
      points: event.points,
      published: event.published,
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        points: parseInt(formData.points),
      };

      await api.patch(`/events/${selectedEvent.id}`, payload);
      alert("Event updated successfully!");
      setShowEditModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.message || "Failed to update event");
    }
  };

  // Handle Delete Event
  const handleDelete = async (eventId, eventName) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}`);
      alert("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      alert(err.message || "Failed to delete event. It may have guests.");
    }
  };

  // Handle Manage Organizers
  const handleManageOrganizers = (event) => {
    setSelectedEvent(event);
    fetchUsers();
    setShowOrganizerModal(true);
  };

  const handleAddOrganizer = async () => {
    if (!selectedUserId) {
      alert("Please select a user");
      return;
    }

    try {
      await api.post(`/events/${selectedEvent.id}/organizers`, {
        userId: parseInt(selectedUserId),
      });
      alert("Organizer added successfully!");
      setSelectedUserId("");
      // Refresh event data
      const updatedEvent = await api.get(`/events/${selectedEvent.id}`);
      setSelectedEvent(updatedEvent);
      fetchEvents();
    } catch (err) {
      alert(err.message || "Failed to add organizer");
    }
  };

  const handleRemoveOrganizer = async (userId) => {
    try {
      await api.delete(`/events/${selectedEvent.id}/organizers/${userId}`);
      alert("Organizer removed successfully!");
      // Refresh event data
      const updatedEvent = await api.get(`/events/${selectedEvent.id}`);
      setSelectedEvent(updatedEvent);
      fetchEvents();
    } catch (err) {
      alert(err.message || "Failed to remove organizer");
    }
  };

  // Helper functions
  const formatDateTimeForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isPastEvent = (event) => {
    return new Date(event.endTime) < new Date();
  };

  // Sorting logic
  const sortEvents = (events, sortField, order) => {
    return [...events].sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case "name":
          compareResult = a.name.localeCompare(b.name);
          break;
        case "status":
          // Sort by published first, then by draft
          compareResult = (b.published === a.published) ? 0 : b.published ? 1 : -1;
          break;
        case "date":
        default:
          compareResult = new Date(a.startTime) - new Date(b.startTime);
          break;
      }

      return order === "asc" ? compareResult : -compareResult;
    });
  };

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle order if clicking same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
    // Reset to page 1 when sorting changes
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  return (
    <div className="manager-container">
      {/* Header */}
      <div className="manager-header">
        <h1>Event Management</h1>
        <p className="header-description">
          Create, edit, and manage events. Add organizers and track attendance.
        </p>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange("all")}
          >
            <i className="fas fa-list"></i> All Events
          </button>
          <button
            className={`filter-btn ${filter === "published" ? "active" : ""}`}
            onClick={() => handleFilterChange("published")}
          >
            <i className="fas fa-check-circle"></i> Published
          </button>
          <button
            className={`filter-btn ${filter === "draft" ? "active" : ""}`}
            onClick={() => handleFilterChange("draft")}
          >
            <i className="fas fa-edit"></i> Drafts
          </button>
        </div>

        <button className="btn-primary" onClick={handleCreate}>
          <i className="fas fa-plus-circle"></i> Create New Event
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
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

      {/* Events Table */}
      {!loading && !error && (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("name")}
                    >
                      Event Name
                      {sortBy === "name" && (
                        <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>
                      )}
                      {sortBy !== "name" && <i className="fas fa-sort"></i>}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("date")}
                    >
                      Date & Time
                      {sortBy === "date" && (
                        <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>
                      )}
                      {sortBy !== "date" && <i className="fas fa-sort"></i>}
                    </button>
                  </th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Points</th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("status")}
                    >
                      Status
                      {sortBy === "status" && (
                        <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>
                      )}
                      {sortBy !== "status" && <i className="fas fa-sort"></i>}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      <i className="fas fa-calendar-times"></i>
                      <p>No events found. Create your first event!</p>
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className={isPastEvent(event) ? "past-event-row" : ""}>
                      <td>
                        <div className="event-name-cell">
                          <strong>{event.name}</strong>
                          {!event.published && (
                            <span className="badge badge-draft">Draft</span>
                          )}
                          {isPastEvent(event) && (
                            <span className="badge badge-past">Past</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <div>{formatDate(event.startTime)}</div>
                          <div className="date-end">to {formatDate(event.endTime)}</div>
                        </div>
                      </td>
                      <td>{event.location}</td>
                      <td>
                        {event.capacity ? (
                          <>
                            {event.guests?.length || 0} / {event.capacity}
                          </>
                        ) : (
                          "Unlimited"
                        )}
                      </td>
                      <td>
                        <div className="points-cell">
                          <div>{event.points} total</div>
                          <div className="points-remain">{event.pointsRemain} remain</div>
                        </div>
                      </td>
                      <td>
                        {event.published ? (
                          <span className="status-badge status-published">Published</span>
                        ) : (
                          <span className="status-badge status-draft">Draft</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-view"
                            onClick={() => navigate(`/events/${event.id}`)}
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(event)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn-icon btn-organizers"
                            onClick={() => handleManageOrganizers(event)}
                            title="Manage Organizers"
                          >
                            <i className="fas fa-users-cog"></i>
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(event.id, event.name)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>

              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitCreate}>
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Capacity (leave empty for unlimited)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>

                <div className="form-group">
                  <label>Points to Allocate *</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  />
                  <span>Publish event (visible to all users)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fas fa-plus-circle"></i> Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Capacity (leave empty for unlimited)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>

                <div className="form-group">
                  <label>Points to Allocate *</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  />
                  <span>Publish event (visible to all users)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fas fa-save"></i> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Organizers Modal */}
      {showOrganizerModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowOrganizerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Organizers</h2>
              <button className="modal-close" onClick={() => setShowOrganizerModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <h3 className="event-title">{selectedEvent.name}</h3>

              {/* Current Organizers */}
              <div className="organizer-section">
                <h4>Current Organizers</h4>
                {selectedEvent.organizers && selectedEvent.organizers.length > 0 ? (
                  <div className="organizer-list">
                    {selectedEvent.organizers.map((org) => (
                      <div key={org.userId} className="organizer-item">
                        <div className="organizer-info">
                          <strong>{org.user?.name || "Unknown"}</strong>
                          <small> ({org.user?.utorid})</small>
                        </div>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleRemoveOrganizer(org.userId)}
                          title="Remove"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No organizers assigned yet.</p>
                )}
              </div>

              {/* Add Organizer */}
              <div className="organizer-section">
                <h4>Add Organizer</h4>
                <div className="add-organizer-form">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="organizer-select"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.utorid}) - {user.role}
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={handleAddOrganizer}>
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowOrganizerModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
