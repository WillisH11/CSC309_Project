import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import "./ManagerTransactions.css";

export default function ManagerTransactionDetail() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);

  const [adjustAmount, setAdjustAmount] = useState("");
  const [remark, setRemark] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadTx() {
      try {
        const data = await api.get(`/transactions/${id}`);
        setTx(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load transaction");
      } finally {
        setLoading(false);
      }
    }
    loadTx();
  }, [id]);

  async function submitAdjustment(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!adjustAmount || isNaN(adjustAmount)) {
      return setError("Enter a valid adjustment amount.");
    }

    try {
      const body = {
        type: "adjustment",
        utorid: tx.user.utorid,
        amount: parseInt(adjustAmount),
        remark,
        relatedId: tx.id
      };

      const res = await api.post("/transactions", body);

      console.log("Adjustment success:", res);
      setSuccess("Adjustment created successfully!");

      // refresh transaction display
      setAdjustAmount("");
      setRemark("");
    } catch (err) {
      console.error("Adjustment failed:", err);
      setError(err.response?.data?.error || "Adjustment failed.");
    }
  }

  if (loading) return <p className="manager-tx-loading">Loading...</p>;
  if (!tx) return <p className="manager-tx-error">Transaction not found.</p>;

  return (
    <div className="manager-tx-page">
      <Link to="/manager/transactions" className="back-link">
        ← Back to All Transactions
      </Link>

      <h1>Transaction #{tx.id}</h1>

      <div className="manager-tx-card">
        <div className="row">
          <span>Type:</span>
          <span>{tx.type}</span>
        </div>

        <div className="row">
          <span>User:</span>
          <span>{tx.user.utorid}</span>
        </div>

        <div className="row">
          <span>Amount:</span>
          <span>{tx.amount}</span>
        </div>

        {tx.type === "purchase" && tx.spent && (
          <div className="row">
            <span>Spent:</span>
            <span>${tx.spent.toFixed(2)}</span>
          </div>
        )}

        {tx.type === "purchase" && tx.promotionBonus && tx.promotionBonus > 0 && (
          <div className="row tx-promotion-bonus">
            <span>🎉 Promotion Bonus:</span>
            <span className="tx-bonus-amount">+{tx.promotionBonus} points</span>
          </div>
        )}

        <div className="row">
          <span>Created By:</span>
          <span>{tx.createdBy?.utorid || "N/A"}</span>
        </div>

        {tx.remark && (
          <div className="row">
            <span>Remark:</span>
            <span>{tx.remark}</span>
          </div>
        )}

        <div className="row">
          <span>Date:</span>
          <span>{new Date(tx.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Adjustment Section */}
      <div className="adjustment-section">
        <h2>Create Adjustment</h2>

        {error && <div className="adjust-error">{error}</div>}
        {success && <div className="adjust-success">{success}</div>}

        <form onSubmit={submitAdjustment}>
          <label>Adjustment Amount</label>
          <input
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="e.g. -20 or 40"
          />

          <label>Remark (optional)</label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Reason for adjustment"
          />

          <button type="submit" className="adjust-btn">
            Submit Adjustment
          </button>
        </form>
      </div>
    </div>
  );
}
