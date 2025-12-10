import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import "./ManagerTransactions.css";
import { Link } from "react-router-dom";

export default function ManagerTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [suspiciousFilter, setSuspiciousFilter] = useState("");
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
        ...(suspiciousFilter !== "" && { suspicious: suspiciousFilter }),
        orderBy,
        orderDir,
      };

      const res = await api.get("/transactions", { params: queryParams });

      if (Array.isArray(res.results)) {
        setTransactions(res.results);
        setTotalCount(res.count || 0);
      } else {
        setTransactions([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("❌ Manager TX load error:", err);
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, suspiciousFilter, orderBy, orderDir]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const totalPages = Math.ceil(totalCount / limit);

  const handleFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const handleSuspiciousFilterChange = (e) => {
    setSuspiciousFilter(e.target.value);
    setPage(1);
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
    return <p className="manager-tx-loading">Loading transactions...</p>;
  if (error) return <p className="manager-tx-error">{error}</p>;

  return (
    <div className="manager-tx-page">
      <h1 className="manager-tx-title">All Transactions</h1>

      {/* Filters and Controls */}
      <div className="manager-tx-controls">
        <div className="manager-tx-filter-group">
          <label htmlFor="type-filter">Filter by Type:</label>
          <select
            id="type-filter"
            className="manager-tx-filter-select"
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

        <div className="manager-tx-filter-group">
          <label htmlFor="suspicious-filter">Suspicious:</label>
          <select
            id="suspicious-filter"
            className="manager-tx-filter-select"
            value={suspiciousFilter}
            onChange={handleSuspiciousFilterChange}
          >
            <option value="">All</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Not Suspicious</option>
          </select>
        </div>

        <div className="manager-tx-filter-group">
          <label htmlFor="order-by">Sort By:</label>
          <select
            id="order-by"
            className="manager-tx-filter-select"
            value={orderBy}
            onChange={handleOrderByChange}
          >
            <option value="createdAt">Date</option>
            <option value="amount">Amount</option>
            <option value="type">Type</option>
          </select>
        </div>

        <div className="manager-tx-filter-group">
          <label>Order:</label>
          <button
            type="button"
            className="manager-tx-order-toggle"
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
        <p className="manager-tx-empty">No transactions found.</p>
      ) : (
        <>
          <div className="manager-tx-list">
            {transactions.map((tx) => (
              <Link
                to={`/manager/transactions/${tx.id}`}
                key={tx.id}
                className={`manager-tx-card type-${tx.type} ${tx.suspicious ? "suspicious" : ""}`}
              >
                <div className="tx-header">
                  <span className="tx-type">{tx.type.toUpperCase()}</span>
                  {tx.suspicious && (
                    <span className="tx-suspicious-badge">⚠️ Suspicious</span>
                  )}
                  <span
                    className={`tx-amount ${
                      tx.amount >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>

                {tx.type === "transfer" && tx.sender ? (
                  <>
                    <div className="tx-line">
                      Recipient: <b>{tx.user?.name || tx.user?.utorid}</b>
                    </div>
                    <div className="tx-line">
                      Sent by: <b>{tx.sender?.name || tx.sender?.utorid}</b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="tx-line">
                      User: <b>{tx.user?.name || tx.user?.utorid}</b>
                    </div>
                    <div className="tx-line">
                      Created by: <b>{tx.createdBy?.name || tx.createdBy?.utorid}</b>
                    </div>
                    {tx.type === "purchase" && tx.promotionBonus && tx.promotionBonus > 0 && (
                      <div className="tx-line tx-promotion-bonus">
                        <span>🎉 Promotion Bonus:</span>
                        <b className="tx-bonus-amount">+{tx.promotionBonus} points</b>
                      </div>
                    )}
                  </>
                )}

                <div className="tx-date">
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="manager-tx-pagination">
              <button
                className="manager-tx-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="manager-tx-pagination-info">
                Page {page} of {totalPages} ({totalCount} total)
              </span>
              <button
                className="manager-tx-pagination-btn"
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
