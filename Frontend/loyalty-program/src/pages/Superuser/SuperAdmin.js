import React, { useState } from "react";
import api from "../../services/api";
import "./SuperAdmin.css";

export default function SuperAdmin() {
  const [utorid, setUtorid] = useState("");
  const [role, setRole] = useState("manager");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePromote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Check if we need to call a specific endpoint.
      // PATCH /users/:utorid with body { role: 'manager' }
      await api.patch(`/users/${utorid}`, { role });

      setMessage({
        type: "success",
        text: `Success! ${utorid} is now a ${role}.`,
      });
      setUtorid("");
    } catch (err) {
      setMessage({
        type: "error",
        text: `Error: ${err.response?.data?.error || err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-admin-container">
      <div className="admin-card">
        <div className="admin-header">
          <h1>
            <i className="fas fa-user-shield"></i>
            Superuser Admin Console
          </h1>
          <p>Manage system access and elevate user privileges.</p>
        </div>

        <div className="admin-content">
          {message && (
            <div className={`status-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePromote}>
            <div className="form-group">
              <label className="form-label">Target User (UTORID)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. masonj"
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign New Role</label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="superuser">Superuser</option>
                <option value="regular">Regular User</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-super">
              {loading ? "Updating Permissions..." : "Update User Role"}
            </button>
          </form>
        </div>

        <div className="admin-footer">
          * Changes take effect immediately. The user may need to re-login.
        </div>
      </div>
    </div>
  );
}
