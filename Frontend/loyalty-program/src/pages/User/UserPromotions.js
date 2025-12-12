import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../Contexts/AuthContext";
import "./UserPromotions.css";

const PAGE_SIZE = 8;

export default function UserPromotions() {
  const { activeRole } = useAuth();

  const [promotions, setPromotions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", PAGE_SIZE);
      if (typeFilter) params.append("type", typeFilter);
      if (searchTerm.trim()) params.append("name", searchTerm.trim());
      if (activeRole === "regular") {
        params.append("viewMode", "regular");
      }

      const res = await api.get(`/promotions?${params.toString()}`);
      setPromotions(res.results || []);
      setCount(res.count || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load promotions.");
    } finally {
      setLoading(false);
    }
  }, [activeRole, page, typeFilter, searchTerm]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / PAGE_SIZE)),
    [count]
  );

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
  }

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="user-promo-page">
      <h1>Available Promotions</h1>
      <p className="promo-subtitle">
        Enjoy exclusive rewards and bonuses while shopping!
      </p>

      <div className="promo-controls">
        <input
          className="promo-search-input"
          placeholder="Search promotions..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <select
          className="promo-filter-select"
          value={typeFilter}
          onChange={handleTypeChange}
        >
          <option value="">All Types</option>
          <option value="automatic">Automatic</option>
          <option value="one-time">One-Time</option>
        </select>
      </div>

      {error && <p className="promo-error">{error}</p>}
      {loading && <p className="promo-loading">Loading promotions...</p>}

      <div className="user-promo-list">
        {promotions.map((p) => (
          <div key={p.id} className="user-promo-card">
            {/* Header */}
            <div className="user-promo-header">
              <h3 className="user-promo-title">{p.name}</h3>

              <span className={`user-promo-badge ${p.type}`}>
                {p.type === "automatic" ? "AUTOMATIC" : "ONE-TIME"}
              </span>
            </div>

            {/* Description */}
            <p className="user-promo-description">{p.description}</p>

            {/* Details */}
            <div className="user-promo-details">
              <p>
                <strong>Ends:</strong> {formatDate(p.endTime)}
              </p>

              {p.type === "automatic" && (
                <p>
                  <strong>Rate:</strong> {p.rate}% cashback
                  {p.minSpending ? (
                    <>
                      <br />
                      <strong>Min Spend:</strong> ${p.minSpending}
                    </>
                  ) : null}
                </p>
              )}

              {p.type === "one-time" && (
                <p>
                  <strong>Bonus Points:</strong> {p.points}
                  <br />
                  <strong>Min Spend:</strong> ${p.minSpending}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && promotions.length === 0 && (
        <p className="promo-empty">No active promotions at this time.</p>
      )}

      {!loading && promotions.length > 0 && (
        <div className="promo-pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <div className="promo-page-info">
            Page {page} of {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
