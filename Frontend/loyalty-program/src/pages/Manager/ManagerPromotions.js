import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../Contexts/AuthContext";
import "./ManagerPromotions.css";
import MessageModal from "../../Components/MessageModal";

/* ---------- Helpers ---------- */
function promoIsExpired(promo) {
  return promo?.endTime && new Date(promo.endTime) < new Date();
}

function promoHasStarted(promo) {
  return promo?.startTime && new Date(promo.startTime) <= new Date();
}

export default function ManagerPromotions() {
  const { activeRole } = useAuth();
  const isRegularView = activeRole === "regular";
  
  const [promotions, setPromotions] = useState([]);
  const [count, setCount] = useState(0);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- Modal State ---------- */
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  /* ---------- Form Fields ---------- */
  const [newName, setNewName] = useState("");
  const [description, setDescription] = useState("");
  const [newType, setNewType] = useState("automatic");
  const [rate, setRate] = useState(""); 
  const [points, setPoints] = useState("");
  const [minSpending, setMinSpending] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [targetRole, setTargetRole] = useState("all");

  const [errors, setErrors] = useState({});
  const [hasStarted, setHasStarted] = useState(false);

  /* ---------- Load Promotions ---------- */
  useEffect(() => {
    loadPromotions();
  }, [page, name, type, status, activeRole]);

  /* ---------- Reset page when filters change ---------- */
  useEffect(() => {
    setPage(1);
  }, [name, type, status]);

  async function loadPromotions() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("limit", limit);
      params.append("page", page);

      // If in regular view, send viewMode=regular to only get active promotions
      if (isRegularView) {
        params.append("viewMode", "regular");
        // In regular view, only show active promotions (filter out past ones)
        // But still allow name and type filters
        if (name) params.append("name", name);
        if (type) params.append("type", type);
      } else {
        // Manager view: allow all filters
        if (name) params.append("name", name);
        if (type) params.append("type", type);
        if (status === "upcoming") params.append("started", "false");
        if (status === "active") params.append("started", "true");
        if (status === "ended") params.append("ended", "true");
      }

      const res = await api.get(`/promotions?${params}`);

      let results = res.results || [];

      // Additional client-side filtering for active status in regular view
      if (isRegularView || status === "active") {
        const now = new Date();
        results = results.filter((p) => {
          const endTime = new Date(p.endTime);
          const startTime = new Date(p.startTime || 0);
          return startTime <= now && endTime >= now;
        });
      }

      setPromotions(results);
      setCount(res.count || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load promotions.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Validation ---------- */
  function validateForm() {
    const e = {};

    if (!newName.trim()) e.name = "Name required.";
    if (!description.trim()) e.description = "Description required.";

    if (!startTime && !hasStarted) e.startTime = "Start time required.";
    if (!endTime) e.endTime = "End time required.";

    if (!hasStarted && startTime && endTime) {
      if (new Date(endTime) <= new Date(startTime)) {
        e.endTime = "End must be after start.";
      }
    }

    if (newType === "automatic") {
      if (!rate || Number(rate) <= 0) e.rate = "Rate (%) must be > 0.";
    }

    if (newType === "one-time") {
      if (!points || Number(points) <= 0) e.points = "Points must be > 0.";
      if (!minSpending || Number(minSpending) <= 0)
        e.minSpending = "Min spending required.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  useEffect(() => {
    validateForm();
  }, [
    newName,
    description,
    rate,
    points,
    minSpending,
    startTime,
    endTime,
    newType,
    hasStarted
  ]);


  function resetForm() {
    setNewName("");
    setDescription("");
    setNewType("automatic");
    setRate("");
    setPoints("");
    setMinSpending("");
    setStartTime("");
    setEndTime("");
    setTargetRole("all");
    setShowCreate(false);
    setShowEdit(false);
    setErrors({});
  }

  /* ---------- Create Promotion ---------- */
  async function handleCreatePromotion() {
    if (!validateForm()) return showMessage("Validation Error", "Please fix the errors in the form.", "error");

    try {
      await api.post("/promotions", {
        name: newName.trim(),
        description: description.trim(),
        type: newType,
        startTime,
        endTime,
        rate: newType === "automatic" ? Number(rate) / 100 : undefined,
        points: newType === "one-time" ? Number(points) : undefined,
        minSpending: minSpending ? Number(minSpending) : null,
        targetRole: targetRole
      });

      showMessage("Success", "Promotion created successfully!", "success");
      resetForm();
      loadPromotions();
    } catch (err) {
      console.error(err);
      showMessage("Error", err.error || "Failed to create promotion.", "error");
    }
  }

  /* ---------- Edit Promotion ---------- */
  function toInputDateTime(val) {
    if (!val) return "";
    const d = new Date(val);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openEditModal(p) {
    setEditId(p.id);

    setNewName(p.name);
    setDescription(p.description);
    setNewType(p.type);

    setStartTime(toInputDateTime(p.startTime));
    setEndTime(toInputDateTime(p.endTime));

    setRate(p.rate ? p.rate * 100 : "");
    setPoints(p.points ?? "");
    setMinSpending(p.minSpending ?? "");
    setTargetRole(p.targetRole || "all");

    const started = promoHasStarted(p);
    setHasStarted(started);

    setShowEdit(true);
  }

  async function handleEditPromotion() {
    if (!validateForm()) return;

    let body;

    if (hasStarted) {
      body = { endTime };
    } else {
      body = {
        name: newName.trim(),
        description: description.trim(),
        type: newType,
        startTime,
        endTime,
        rate: newType === "automatic" ? Number(rate) / 100 : undefined,
        points: newType === "one-time" ? Number(points) : undefined,
        minSpending: minSpending ? Number(minSpending) : null,
        targetRole: targetRole
      };
    }

    try {
      await api.patch(`/promotions/${editId}`, body);
      showMessage("Success", "Promotion updated successfully!", "success");
      resetForm();
      loadPromotions();
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to update promotion.");
    }
  }

  /* ---------- Delete Promotion ---------- */
  async function deletePromotion(id) {
    if (!window.confirm("Delete this promotion?")) return;
    try {
      await api.delete(`/promotions/${id}`);
      loadPromotions();
    } catch (err) {
      alert(err.error || "Failed to delete promotion.");
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="manager-promo-page">
      <h1>Promotion Management</h1>
      {isRegularView && (
        <p style={{ color: "#666", fontStyle: "italic", marginBottom: "1rem" }}>
          Regular View: Only active promotions are shown. Editing is disabled.
        </p>
      )}

      {/* Filters */}
      <div className="promo-action-bar">
        <input
          className="promo-search"
          placeholder="Search promotions by name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="promo-filters-row">
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            disabled={isRegularView}
          >
            <option value="">All Types</option>
            <option value="automatic">Automatic</option>
            <option value="one-time">One-Time</option>
          </select>

          {!isRegularView && (
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          )}

          {!isRegularView && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              + Create Promotion
            </button>
          )}
        </div>
      </div>

      {/* Promotion Cards */}
      {loading && <p>Loading promotions...</p>}
      {error && <p className="promo-error">{error}</p>}
      {!loading && !error && promotions.length === 0 && (
        <p className="promo-empty">No such promotion found.</p>
      )}
      <div className="manager-promo-list">
        {promotions.map((p) => (
          <div key={p.id} className="promo-card">
            <div className="promo-card-header">
              <h3 className="promo-title">{p.name}</h3>

              <div className="promo-badge-group">
                <span className={`promo-badge ${p.type}`}>
                  {p.type === "automatic" ? "AUTO" : "ONE-TIME"}
                </span>

                {promoIsExpired(p) && (
                  <span className="promo-badge expired">EXPIRED</span>
                )}
              </div>
            </div>

            <div className="promo-card-body">
              <p><strong>Description:</strong> {p.description}</p>
              <p><strong>Ends:</strong> {new Date(p.endTime).toLocaleString()}</p>

              {p.type === "automatic" && (
                <p>
                  <strong>Rate:</strong> {p.rate * 100}%<br />
                  <strong>Min:</strong> ${p.minSpending ?? 0}
                </p>
              )}

              {p.type === "one-time" && (
                <p>
                  <strong>Points:</strong> {p.points}<br />
                  <strong>Min:</strong> ${p.minSpending}
                </p>
              )}
            </div>

            {!isRegularView && (
              <div className="promo-card-footer">
                <button
                  disabled={promoIsExpired(p)}
                  className={`promo-btn edit ${promoIsExpired(p) ? "disabled" : ""}`}
                  onClick={() => openEditModal(p)}
                >
                  Edit
                </button>

                <button
                  className="promo-btn delete"
                  onClick={() => deletePromotion(p.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {count > limit && (
        <div className="pagination" style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          gap: "1rem", 
          marginTop: "2rem",
          padding: "1rem"
        }}>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "2px solid var(--color-border)",
              background: page === 1 ? "#f0f0f0" : "white",
              cursor: page === 1 ? "not-allowed" : "pointer",
              color: page === 1 ? "#999" : "inherit"
            }}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>

          <div className="pagination-info" style={{ 
            minWidth: "120px", 
            textAlign: "center",
            fontWeight: 600
          }}>
            Page {page} of {Math.ceil(count / limit)}
          </div>

          <button
            type="button"
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(Math.ceil(count / limit), p + 1))}
            disabled={page >= Math.ceil(count / limit)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "2px solid var(--color-border)",
              background: page >= Math.ceil(count / limit) ? "#f0f0f0" : "white",
              cursor: page >= Math.ceil(count / limit) ? "not-allowed" : "pointer",
              color: page >= Math.ceil(count / limit) ? "#999" : "inherit"
            }}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <PromoModal
          title="Create Promotion"
          errors={errors}
          newName={newName}
          description={description}
          newType={newType}
          startTime={startTime}
          endTime={endTime}
          rate={rate}
          points={points}
          minSpending={minSpending}
          targetRole={targetRole}
          setNewName={setNewName}
          setDescription={setDescription}
          setNewType={setNewType}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          setRate={setRate}
          setPoints={setPoints}
          setMinSpending={setMinSpending}
          setTargetRole={setTargetRole}
          onSave={handleCreatePromotion}
          onCancel={resetForm}
          hasStarted={false}
        />
      )}

      {/* Edit Modal */}
      {showEdit && (
        <PromoModal
          title="Edit Promotion"
          errors={errors}
          newName={newName}
          description={description}
          newType={newType}
          startTime={startTime}
          endTime={endTime}
          rate={rate}
          points={points}
          minSpending={minSpending}
          targetRole={targetRole}
          setNewName={setNewName}
          setDescription={setDescription}
          setNewType={setNewType}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          setRate={setRate}
          setPoints={setPoints}
          setMinSpending={setMinSpending}
          setTargetRole={setTargetRole}
          onSave={handleEditPromotion}
          onCancel={resetForm}
          hasStarted={hasStarted}
        />
      )}
    </div>
  );
}

/* ---------- Shared Modal Component ---------- */

function PromoModal({
  title,
  errors,
  newName,
  description,
  newType,
  startTime,
  endTime,
  rate,
  points,
  minSpending,
  targetRole,
  setNewName,
  setDescription,
  setNewType,
  setStartTime,
  setEndTime,
  setRate,
  setPoints,
  setMinSpending,
  setTargetRole,
  onSave,
  onCancel,
  hasStarted
}) {
  return (
    <div className="promo-modal-overlay">
      <div className="promo-modal-content">

        <div className="promo-modal-header">
          <h2>{title}</h2>
          <button className="promo-modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="promo-modal-body">
          <form className="promo-form">

            {/* Basic Fields */}
            {!hasStarted && (
              <>
                <div className="promo-form-group">
                  <label>Name *</label>
                  <input
                    className={`promo-input ${errors.name ? "invalid" : ""}`}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  {errors.name && <p className="promo-error-msg">{errors.name}</p>}
                </div>

                <div className="promo-form-group">
                  <label>Description *</label>
                  <textarea
                    className={`promo-textarea ${errors.description ? "invalid" : ""}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                  {errors.description && <p className="promo-error-msg">{errors.description}</p>}
                </div>

                <div className="promo-form-group">
                  <label>Type *</label>
                  <select
                    className="promo-input"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="automatic">Automatic</option>
                    <option value="one-time">One-Time</option>
                  </select>
                </div>

                <div className="promo-form-group">
                  <label>Target Users *</label>
                  <select
                    className="promo-input"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="cashier">Cashier+ (Cashier, Manager, Superuser)</option>
                    <option value="manager">Manager+ (Manager, Superuser)</option>
                  </select>
                </div>
              </>
            )}

            {/* Times */}
            <div className="promo-grid-2">
              {!hasStarted && (
                <div className="promo-form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`promo-input ${errors.startTime ? "invalid" : ""}`}
                  />
                  {errors.startTime && <p className="promo-error-msg">{errors.startTime}</p>}
                </div>
              )}

              <div className="promo-form-group">
                <label>End Time *</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`promo-input ${errors.endTime ? "invalid" : ""}`}
                />
                {errors.endTime && <p className="promo-error-msg">{errors.endTime}</p>}
              </div>
            </div>

            {/* Automatic Settings */}
            {!hasStarted && newType === "automatic" && (
              <div className="promo-grid-2">
                <div className="promo-form-group">
                  <label>Rate (%) *</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className={`promo-input ${errors.rate ? "invalid" : ""}`}
                  />
                  {errors.rate && <p className="promo-error-msg">{errors.rate}</p>}
                </div>

                <div className="promo-form-group">
                  <label>Min Spending</label>
                  <input
                    type="number"
                    value={minSpending}
                    onChange={(e) => setMinSpending(e.target.value)}
                    className="promo-input"
                  />
                </div>
              </div>
            )}

            {/* One Time Settings */}
            {!hasStarted && newType === "one-time" && (
              <div className="promo-grid-2">
                <div className="promo-form-group">
                  <label>Points *</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className={`promo-input ${errors.points ? "invalid" : ""}`}
                  />
                  {errors.points && <p className="promo-error-msg">{errors.points}</p>}
                </div>

                <div className="promo-form-group">
                  <label>Min Spending *</label>
                  <input
                    type="number"
                    value={minSpending}
                    onChange={(e) => setMinSpending(e.target.value)}
                    className={`promo-input ${errors.minSpending ? "invalid" : ""}`}
                  />
                  {errors.minSpending && (
                    <p className="promo-error-msg">{errors.minSpending}</p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="promo-modal-actions">
          <button className="promo-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="promo-btn-primary" onClick={onSave}>
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
