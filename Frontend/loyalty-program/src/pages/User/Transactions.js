import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import "./Transactions.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [orderDir, setOrderDir] = useState("desc");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = {
        page,
        limit,
        ...(typeFilter && { type: typeFilter }),
        orderBy,
        orderDir,
      };

      const res = await api.get("/users/me/transactions", { params: queryParams });

      if (Array.isArray(res.results)) {
        setTransactions(res.results);
        setTotalCount(res.count || 0);
      } else {
        setTransactions([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("❌ Transaction load error:", err);
      setError(err.message || "Unable to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, orderBy, orderDir]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const totalPages = Math.ceil(totalCount / limit);

  const handleFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleOrderByChange = (e) => {
    setOrderBy(e.target.value);
    setPage(1);
  };

  const handleOrderDirToggle = () => {
    setOrderDir(orderDir === "asc" ? "desc" : "asc");
    setPage(1);
  };

  if (loading && transactions.length === 0)
    return <p className="tx-loading">Loading...</p>;
  if (error) return <p className="tx-error">{error}</p>;

  return (
    <div className="tx-page">
      <h1 className="tx-title">Transaction History</h1>

      {/* Filters and Controls */}
      <div className="tx-controls">
        <div className="tx-filter-group">
          <label htmlFor="type-filter">Filter by Type:</label>
          <select
            id="type-filter"
            className="tx-filter-select"
            value={typeFilter}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="redemption">Redemption</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
            <option value="event">Event</option>
          </select>
        </div>

        <div className="tx-filter-group">
          <label htmlFor="order-by">Sort By:</label>
          <select
            id="order-by"
            className="tx-filter-select"
            value={orderBy}
            onChange={handleOrderByChange}
          >
            <option value="createdAt">Date</option>
            <option value="amount">Amount</option>
          </select>
        </div>

        <div className="tx-filter-group">
          <label>Order:</label>
          <button
            type="button"
            className="tx-order-toggle"
            onClick={handleOrderDirToggle}
            title={orderDir === "asc" ? "Currently: Ascending" : "Currently: Descending"}
          >
            <i className={`fas fa-sort-${orderDir === "asc" ? "amount-down" : "amount-up"}`}></i>
            <span>{orderDir === "asc" ? "Ascending" : "Descending"}</span>
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <p className="tx-empty">No transactions found.</p>
      ) : (
        <>
          <div className="tx-list">
            {transactions.map((tx) => (
              <TxCard key={tx.id} tx={tx} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="tx-pagination">
              <button
                className="tx-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="tx-pagination-info">
                Page {page} of {totalPages} ({totalCount} total)
              </span>
              <button
                className="tx-pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* CARD COMPONENT */
function TxCard({ tx }) {
  const amount = computeAmount(tx);

  return (
    <div className={`tx-card type-${tx.type}`}>
      <div className="tx-header">
        <span className="tx-type">{tx.type.toUpperCase()}</span>
        <span
          className={`tx-amount ${
            amount >= 0 ? "positive" : "negative"
          }`}
        >
          {amount > 0 ? "+" : ""}
          {amount}
        </span>
      </div>

      {/* TRANSFER → show related user's name and utorid */}
      {tx.type === "transfer" && tx.relatedUser && (
        <>
          <div className="tx-line">
            {amount < 0 ? "Sent To:" : "Received From:"} <b>{tx.relatedUser.name} ({tx.relatedUser.utorid})</b>
          </div>
        </>
      )}

      {/* Other transaction types */}
      {tx.type !== "transfer" && (
        <>
          <div className="tx-line">
            Created by: <b>{tx.createdBy?.name || tx.createdBy?.utorid || "N/A"}</b>
          </div>

          {/* ADJUSTMENT → show "Transaction #XX" */}
          {tx.type === "adjustment" && (
            <div className="tx-line">
              Adjusted For: <b>Transaction #{tx.relatedId}</b>
            </div>
          )}

          {/* PURCHASE */}
          {tx.type === "purchase" && (
            <>
              {tx.spent && (
                <div className="tx-line">
                  Spent: <b>${tx.spent.toFixed(2)}</b>
                </div>
              )}
              {tx.promotionBonus && tx.promotionBonus > 0 && (
                <div className="tx-line tx-promotion-bonus">
                  <span>🎉 Promotion Bonus:</span>
                  <b className="tx-bonus-amount">+{tx.promotionBonus} points</b>
                </div>
              )}
            </>
          )}

          {/* REDEMPTION */}
          {tx.type === "redemption" && (
            <div className="tx-line">
              Redeemed: <b>{tx.redeemed} points</b>
            </div>
          )}

          {/* EVENT */}
          {tx.type === "event" && (
            <div className="tx-line">
              Points Awarded: <b className="tx-bonus-amount">+{tx.amount} points</b>
            </div>
          )}
        </>
      )}

      {tx.remark && (
        <div className="tx-line" style={{ fontStyle: "italic", color: "var(--color-text-muted)" }}>
          {tx.remark}
        </div>
      )}

      <div className="tx-date">
        {new Date(tx.createdAt).toLocaleString()}
      </div>
    </div>
  );
}

/* AMOUNT CALCULATION LOGIC */
function computeAmount(tx) {
  switch (tx.type) {
    case "transfer":
      return tx.amount;

    case "purchase":
      return tx.amount;

    case "redemption":
      return -tx.redeemed;

    case "adjustment":
      return tx.amount;

    case "event":
      return tx.amount;

    default:
      return 0;
  }
}
