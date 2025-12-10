import { useState, useEffect } from "react";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import "./ManagerUsers.css";
import "../../Components/Button.css";

export default function ManagerUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [activatedFilter, setActivatedFilter] = useState("");

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: currentPage,
        limit,
      };

      if (searchTerm) params.name = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (verifiedFilter) params.verified = verifiedFilter;
      if (activatedFilter) params.activated = activatedFilter;

      const data = await api.get("/users", { params });
      setUsers(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, verifiedFilter, activatedFilter]);

  // Fetch users when page or filters change
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, roleFilter, verifiedFilter, activatedFilter]);

  // Pagination
  const totalPages = Math.ceil(totalCount / limit);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setVerifiedFilter("");
    setActivatedFilter("");
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Verify user
  const handleVerifyUser = async (userId) => {
    setActionLoading({ ...actionLoading, [`verify-${userId}`]: true });
    try {
      await api.patch(`/users/${userId}`, { verified: true });
      // Update local state
      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, verified: true } : u));
      setUsers(updatedUsers);
      // Update selected user if it's the one being modified
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, verified: true });
      }
    } catch (err) {
      alert(err.message || "Failed to verify user");
    } finally {
      setActionLoading({ ...actionLoading, [`verify-${userId}`]: false });
    }
  };

  // Change user role
  const handleChangeRole = async (userId, newRole) => {
    setActionLoading({ ...actionLoading, [`role-${userId}`]: true });
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      // Update local state
      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
      setUsers(updatedUsers);
      // Update selected user if it's the one being modified
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (err) {
      alert(err.message || "Failed to change role");
    } finally {
      setActionLoading({ ...actionLoading, [`role-${userId}`]: false });
    }
  };

  // Toggle suspicious status
  const handleToggleSuspicious = async (userId, currentStatus) => {
    setActionLoading({ ...actionLoading, [`suspicious-${userId}`]: true });
    try {
      const newStatus = !currentStatus;
      await api.patch(`/users/${userId}`, { suspicious: newStatus });
      // Update local state
      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, suspicious: newStatus } : u));
      setUsers(updatedUsers);
      // Update selected user if it's the one being modified
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, suspicious: newStatus });
      }
    } catch (err) {
      alert(err.message || "Failed to update suspicious status");
    } finally {
      setActionLoading({ ...actionLoading, [`suspicious-${userId}`]: false });
    }
  };

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (currentUser?.role === "superuser") {
      return ["regular", "cashier", "manager", "superuser"];
    } else if (currentUser?.role === "manager") {
      return ["regular", "cashier"];
    }
    return [];
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>User Management</h1>
        <p className="header-description">
          View and manage all users in the system
        </p>
      </div>

      {/* Search and Filters */}
      <div className="users-controls">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name or UTORid..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>
              <i className="fas fa-user-tag"></i> Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Roles</option>
              <option value="regular">Regular</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="superuser">Superuser</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <i className="fas fa-check-circle"></i> Verified
            </label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <i className="fas fa-power-off"></i> Status
            </label>
            <select
              value={activatedFilter}
              onChange={(e) => setActivatedFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="true">Activated</option>
              <option value="false">Not Activated</option>
            </select>
          </div>

          {(searchTerm || roleFilter || verifiedFilter || activatedFilter) && (
            <button
              className="btn btn--outline btn--small"
              onClick={handleClearFilters}
            >
              <i className="fas fa-times"></i> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* User Count */}
      <div className="results-info">
        <p>
          <i className="fas fa-users"></i> Showing {users.length} of {totalCount} users
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="message-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-users-slash"></i>
          <h3>No users found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>UTORid</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Points</th>
                  <th>Verified</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} onClick={() => setSelectedUser(user)} className="clickable-row">
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} />
                          ) : (
                            <i className="fas fa-user-circle"></i>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="utorid-badge">@{user.utorid}</span>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="points-cell">
                        <i className="fas fa-star"></i> {user.points}
                      </span>
                    </td>
                    <td>
                      {user.verified ? (
                        <span className="status-badge status-verified">
                          <i className="fas fa-check-circle"></i> Verified
                        </span>
                      ) : (
                        <span className="status-badge status-unverified">
                          <i className="fas fa-times-circle"></i> Unverified
                        </span>
                      )}
                    </td>
                    <td className="date-cell">
                      {user.lastLogin ? (
                        <>
                          <i className="fas fa-clock"></i> {formatDate(user.lastLogin)}
                        </>
                      ) : (
                        <span className="never-logged-in">
                          <i className="fas fa-user-slash"></i> Never
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>

              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-user-info">
                <div className="modal-avatar">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.name} />
                  ) : (
                    <i className="fas fa-user-circle"></i>
                  )}
                </div>
                <div>
                  <h2>{selectedUser.name}</h2>
                  <p className="modal-utorid">@{selectedUser.utorid}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* User Details */}
              <div className="detail-section">
                <h3><i className="fas fa-info-circle"></i> User Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="detail-item">
                    <label>Role</label>
                    <p>
                      <span className={`role-badge role-${selectedUser.role}`}>
                        {selectedUser.role}
                      </span>
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Points</label>
                    <p>
                      <span className="points-cell">
                        <i className="fas fa-star"></i> {selectedUser.points}
                      </span>
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <div className="status-with-action">
                      {selectedUser.verified ? (
                        <span className="status-badge status-verified">
                          <i className="fas fa-check-circle"></i> Verified
                        </span>
                      ) : (
                        <>
                          <span className="status-badge status-unverified">
                            <i className="fas fa-times-circle"></i> Unverified
                          </span>
                          <button
                            className="verify-inline-btn"
                            onClick={() => handleVerifyUser(selectedUser.id)}
                            disabled={actionLoading[`verify-${selectedUser.id}`]}
                          >
                            {actionLoading[`verify-${selectedUser.id}`] ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-check"></i>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Last Login</label>
                    <p className="date-text">
                      {selectedUser.lastLogin ? (
                        <>
                          <i className="fas fa-clock"></i> {formatDate(selectedUser.lastLogin)}
                        </>
                      ) : (
                        <span className="never-logged-in">
                          <i className="fas fa-user-slash"></i> Never
                        </span>
                      )}
                    </p>
                  </div>
                  {selectedUser.role === "cashier" && (
                    <div className="detail-item">
                      <label>Suspicious Status</label>
                      <p>
                        {selectedUser.suspicious ? (
                          <span className="status-badge" style={{ background: '#ffebee', color: '#c62828' }}>
                            <i className="fas fa-exclamation-triangle"></i> Suspicious
                          </span>
                        ) : (
                          <span className="status-badge" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                            <i className="fas fa-shield-alt"></i> Trustworthy
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Section */}
              <div className="detail-section">
                <h3><i className="fas fa-cog"></i> Actions</h3>

                {/* Change Role and Suspicious Status Side by Side */}
                <div className="modal-actions-grid">
                  {/* Change Role */}
                  <div className="action-group">
                    <label><i className="fas fa-user-tag"></i> Change Role</label>
                    <div className="role-buttons">
                      {getAvailableRoles().map((role) => (
                        <button
                          key={role}
                          className={`btn btn--small ${selectedUser.role === role ? 'btn--primary' : 'btn--outline'}`}
                          onClick={() => handleChangeRole(selectedUser.id, role)}
                          disabled={selectedUser.role === role || actionLoading[`role-${selectedUser.id}`]}
                        >
                          {actionLoading[`role-${selectedUser.id}`] ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            selectedUser.role === role && <i className="fas fa-check"></i>
                          )}
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suspicious Toggle (only for cashiers) */}
                  {selectedUser.role === "cashier" && (
                    <div className="action-group">
                      <label><i className="fas fa-shield-alt"></i> Suspicious Status</label>
                      <button
                        className="btn btn--outline btn--small"
                        onClick={() => handleToggleSuspicious(selectedUser.id, selectedUser.suspicious)}
                        disabled={actionLoading[`suspicious-${selectedUser.id}`]}
                        style={selectedUser.suspicious ? { borderColor: '#2e7d32', color: '#2e7d32', width: '100%' } : { borderColor: '#c62828', color: '#c62828', width: '100%' }}
                      >
                        {actionLoading[`suspicious-${selectedUser.id}`] ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Updating...
                          </>
                        ) : selectedUser.suspicious ? (
                          <>
                            <i className="fas fa-shield-alt"></i> Mark as Trustworthy
                          </>
                        ) : (
                          <>
                            <i className="fas fa-exclamation-triangle"></i> Mark as Suspicious
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
