import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./ManagerPromotions.css";

function promoisExpired(promo) {
  if (!promo?.endTime) return false;
  return new Date(promo.endTime) < new Date();
}

function promohasStarted(promo) {
  if (!promo?.startTime) return false;
  return new Date(promo.startTime) <= new Date();
}




export default function ManagerPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [count, setCount] = useState(0);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState(""); // NEW unified filter

  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states (create & edit)
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form fields
  const [newName, setNewName] = useState("");
  const [description, setDescription] = useState("");
  const [newType, setNewType] = useState("automatic");
  const [rate, setRate] = useState("");
  const [points, setPoints] = useState("");
  const [minSpending, setMinSpending] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [errors, setErrors] = useState({});
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, [page, name, type, status]);

  async function loadPromotions() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.append("limit", limit);
      params.append("page", page);

      if (name) params.append("name", name);
      if (type) params.append("type", type);

      // ⭐ STATUS FILTER → backend safe logic
      if (status === "upcoming") {
        params.append("started", "false");
      }

      if (status === "active") {
        // Backend-safe: only send started=true
        params.append("started", "true");
      }

      if (status === "ended") {
        params.append("ended", "true");
      }

      const res = await api.get(`/promotions?${params.toString()}`);

      let results = res.results || [];

      // ⭐ Client-side filtering for ACTIVE (remove ended)
      if (status === "active") {
        const now = new Date();
        results = results.filter(p => new Date(p.endTime) >= now);
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

  async function deletePromotion(id) {
    if (!window.confirm("Delete this promotion?")) return;
    try {
      await api.delete(`/promotions/${id}`);
      loadPromotions();
    } catch (err) {
      alert(err.error || "Failed to delete promotion");
    }
  }

  // =========================
  // VALIDATION
  // =========================
  function validateForm() {
    const newErrors = {};

    if (!newName.trim()) newErrors.name = "Name required.";
    if (!description.trim()) newErrors.description = "Description required.";

    if (!startTime) newErrors.startTime = "Start time required.";
    if (!endTime) newErrors.endTime = "End time required.";

    if (startTime && endTime) {
      if (new Date(endTime) <= new Date(startTime)) {
        newErrors.endTime = "End must be after start.";
      }
    }

    if (newType === "automatic") {
      if (!rate || Number(rate) <= 0) newErrors.rate = "Rate must be > 0";
    }

    if (newType === "one-time") {
      if (!points || Number(points) <= 0) newErrors.points = "Points must be > 0";
      if (!minSpending || Number(minSpending) <= 0)
        newErrors.minSpending = "Min spending required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  useEffect(() => {
    validateForm();
  }, [newName, description, startTime, endTime, rate, points, minSpending, newType]);

  function resetForm() {
    setNewName("");
    setDescription("");
    setNewType("automatic");
    setRate("");
    setPoints("");
    setMinSpending("");
    setStartTime("");
    setEndTime("");
    setErrors({});
    setShowCreate(false);
    setShowEdit(false);
  }

  // =========================
  // CREATE PROMOTION
  // =========================
  async function handleCreatePromotion() {
    if (!validateForm()) return alert("Fix validation errors.");

    try {
      await api.post("/promotions", {
        name: newName.trim(),
        description: description.trim(),
        type: newType,
        startTime,
        endTime,
        rate: newType === "automatic" ? Number(rate) : undefined,
        points: newType === "one-time" ? Number(points) : undefined,
        minSpending: minSpending ? Number(minSpending) : null
      });

      alert("Promotion created!");
      resetForm();
      loadPromotions();
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to create promotion.");
    }
  }

  // OPEN EDIT MODAL
  function toInputDateTime(value) {
    if (!value) return "";
    const date = new Date(value);

    const pad = (n) => String(n).padStart(2, "0");

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  function openEditModal(promo) {
    setEditId(promo.id);

    setNewName(promo.name ?? "");
    setDescription(promo.description ?? "");
    setNewType(promo.type ?? "automatic");

    setStartTime(toInputDateTime(promo.startTime));
    setEndTime(toInputDateTime(promo.endTime));

    setRate(promo.rate ?? "");
    setPoints(promo.points ?? "");
    setMinSpending(promo.minSpending ?? "");

    setHasStarted(promohasStarted(promo));

    setErrors({});
    setShowEdit(true);
  }


  // =========================
  // EDIT PROMOTION
  // =========================
  async function handleEditPromotion() {
    if (!validateForm()) return;

    let body = {};

    if (hasStarted) {
      body = { endTime };
    } else {
      body = {
        name: newName.trim(),
        description: description.trim(),
        type: newType,
        startTime,
        endTime,
        rate: newType === "automatic" ? Number(rate) : undefined,
        points: newType === "one-time" ? Number(points) : undefined,
        minSpending: minSpending ? Number(minSpending) : null
      };
    }

    try {
      await api.patch(`/promotions/${editId}`, body);
      alert("Promotion updated!");
      resetForm();
      loadPromotions();
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to update promotion");
    }
  }

  return (
    <div className="manager-promo-page">

      <h1>Promotion Management</h1>

      {/* ========================= */}
      {/* FILTER BAR */}
      {/* ========================= */}
      <div className="promo-action-bar">
        <input
          className="promo-search"
          placeholder="Search…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="promo-filters-row">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="automatic">Automatic</option>
            <option value="one-time">One-Time</option>
          </select>

          {/* ⭐ UNIFIED STATUS FILTER */}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>

          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + Create Promotion
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* LIST */}
      {/* ========================= */}
      <div className="manager-promo-list">
        {promotions.map((p) => (
          <div key={p.id} className="promo-card">
            <div className="promo-card-header">
              <h3 className="promo-title">
                {p.name || "(Untitled Promotion)"}
              </h3>

              <div className="promo-badge-group">
                <span className={`promo-badge ${p.type}`}>
                  {p.type === "automatic" ? "AUTO" : "ONE-TIME"}
                </span>

                {promoisExpired(p) && (
                  <span className="promo-badge expired">EXPIRED</span>
                )}
              </div>
            </div>
            <div className="promo-card-body">
              <p><strong>Description:</strong> {p.description}</p>
              <p><strong>Ends:</strong> {new Date(p.endTime).toLocaleString()}</p>

              {p.type === "automatic" && (
                <p><strong>Rate:</strong> {p.rate}%<br /> <strong>Min:</strong> ${p.minSpending ?? 0}</p>
              )}

              {p.type === "one-time" && (
                <p><strong>Points:</strong> {p.points}<br /> <strong>Min:</strong> ${p.minSpending}</p>
              )}
            </div>

            <div className="promo-card-footer">
              <button
              className={`promo-btn edit ${promoisExpired(p) ? "disabled" : ""}`}
              disabled={promoisExpired(p)}
              onClick={() => !promoisExpired(p) && openEditModal(p)}
              >
                Edit
              </button>
              <button className="promo-btn delete" onClick={() => deletePromotion(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================= */}
      {/* CREATE MODAL */}
      {/* ========================= */}
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
          setNewName={setNewName}
          setDescription={setDescription}
          setNewType={setNewType}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          setRate={setRate}
          setPoints={setPoints}
          setMinSpending={setMinSpending}
          validateForm={validateForm}
          onSave={handleCreatePromotion}
          onCancel={resetForm}
          hasStarted={false}
        />
      )}

      {/* ========================= */}
      {/* EDIT MODAL */}
      {/* ========================= */}
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
          setNewName={setNewName}
          setDescription={setDescription}
          setNewType={setNewType}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          setRate={setRate}
          setPoints={setPoints}
          setMinSpending={setMinSpending}
          validateForm={validateForm}
          onSave={handleEditPromotion}
          onCancel={resetForm}
          hasStarted={hasStarted}
        />
      )}

    </div>
  );
}

/* ====================================
   SHARED MODAL COMPONENT
===================================== */

function PromoModal({
  title, errors, newName, description, newType, startTime, endTime,
  rate, points, minSpending, setNewName, setDescription, setNewType,
  setStartTime, setEndTime, setRate, setPoints, setMinSpending,
  validateForm, onSave, onCancel, hasStarted
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

            {/* BASIC */}
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
                  />
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
              </>
            )}

            {/* DATE TIME */}
            <div className="promo-grid-2">
              {!hasStarted && (
                <div className="promo-form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    className={`promo-input ${errors.startTime ? "invalid" : ""}`}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  {errors.startTime && <p className="promo-error-msg">{errors.startTime}</p>}
                </div>
              )}

              <div className="promo-form-group">
                <label>End Time *</label>
                <input
                  type="datetime-local"
                  className={`promo-input ${errors.endTime ? "invalid" : ""}`}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                {errors.endTime && <p className="promo-error-msg">{errors.endTime}</p>}
              </div>
            </div>

            {/* SETTINGS */}
            {!hasStarted && (
              <>
                {newType === "automatic" && (
                  <div className="promo-grid-2">
                    <div className="promo-form-group">
                      <label>Rate (%) *</label>
                      <input
                        type="number"
                        className={`promo-input ${errors.rate ? "invalid" : ""}`}
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                      {errors.rate && <p className="promo-error-msg">{errors.rate}</p>}
                    </div>

                    <div className="promo-form-group">
                      <label>Min Spending</label>
                      <input
                        type="number"
                        className="promo-input"
                        value={minSpending}
                        onChange={(e) => setMinSpending(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {newType === "one-time" && (
                  <div className="promo-grid-2">
                    <div className="promo-form-group">
                      <label>Points *</label>
                      <input
                        type="number"
                        className={`promo-input ${errors.points ? "invalid" : ""}`}
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                      />
                      {errors.points && <p className="promo-error-msg">{errors.points}</p>}
                    </div>

                    <div className="promo-form-group">
                      <label>Min Spending *</label>
                      <input
                        type="number"
                        className={`promo-input ${errors.minSpending ? "invalid" : ""}`}
                        value={minSpending}
                        onChange={(e) => setMinSpending(e.target.value)}
                      />
                      {errors.minSpending && <p className="promo-error-msg">{errors.minSpending}</p>}
                    </div>
                  </div>
                )}
              </>
            )}

          </form>
        </div>

        <div className="promo-modal-actions">
          <button className="promo-btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="promo-btn-primary" onClick={onSave}>Save</button>
        </div>

      </div>
    </div>
  );
}
