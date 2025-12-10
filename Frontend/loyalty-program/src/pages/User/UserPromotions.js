import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./UserPromotions.css";

export default function UserPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    try {
      setLoading(true);
      const res = await api.get("/promotions"); // user mode returns only active promotions
      setPromotions(res.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load promotions.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
  }

  return (
    <div className="user-promo-page">
      <h1>Available Promotions</h1>
      <p className="promo-subtitle">
        Enjoy exclusive rewards and bonuses while shopping!
      </p>

      {error && <p className="promo-error">{error}</p>}
      {loading && <p>Loading promotions...</p>}

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
                  ) : (
                    ""
                  )}
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
    </div>
  );
}
