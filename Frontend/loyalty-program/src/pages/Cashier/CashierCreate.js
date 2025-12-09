import React, { useState } from "react";
import api from "../../services/api";
import "./Cashier.css";

export default function CashierCreate() {
  const [utorid, setUtorid] = useState("");
  const [spent, setSpent] = useState("");
  const [remark, setRemark] = useState("");

  const [earnedPreview, setEarnedPreview] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-calc earned points (1 point per 0.25)
  function updateSpent(value) {
    setSpent(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setEarnedPreview(Math.round((num * 100) / 25));
    } else {
      setEarnedPreview(0);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.post("/transactions", {
        type: "purchase",
        utorid: utorid.trim(),
        spent: parseFloat(spent),
        remark,
        promotionIds: []
      });

      setSuccessMsg(`Purchase created! Earned ${res.earned} points.`);
      setUtorid("");
      setSpent("");
      setRemark("");
      setEarnedPreview(0);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create purchase.");
    }
  }

  return (
    <div className="cashier-dashboard">
      <h1>Create Purchase Transaction</h1>

      <div className="cashier-form-container">

        {/* SUCCESS BANNER */}
        {successMsg && (
          <div className="banner success-banner">
            {successMsg}
          </div>
        )}

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="banner error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="field-group">
            <label>Customer UTORid</label>
            <input
              type="text"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              placeholder="e.g. regularuser"
              required
            />
            <small className="hint">Must be an existing customer.</small>
          </div>

          <div className="field-group">
            <label>Amount Spent ($)</label>
            <input
              type="number"
              step="0.01"
              value={spent}
              onChange={(e) => updateSpent(e.target.value)}
              placeholder="e.g. 12.50"
              required
            />
            <small className="hint">1 point per $0.25 spent.</small>
          </div>

          {/* Earned preview */}
          {earnedPreview > 0 && (
            <div className="earned-preview">
              + {earnedPreview} points will be awarded
            </div>
          )}

          <div className="field-group">
            <label>Remark (optional)</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional note"
            />
          </div>

          <button type="submit" className="cashier-button">
            Submit Purchase
          </button>

        </form>
      </div>
    </div>
  );
}
