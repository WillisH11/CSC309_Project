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
            <option value="type">Type</option>
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
  const isPositive = amount > 0;

  return (
    <div className={`tx-card type-${tx.type}`}>
      <div className="tx-card-header">
        <span className="tx-type">{tx.type.toUpperCase()}</span>

        <span className={`tx-amount ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? "+" : ""}
          {amount}
        </span>
      </div>

      <div className="tx-body">
        <div className="tx-row">
          <span>Created By:</span>
          <span>{tx.createdBy?.name || tx.createdBy?.utorid || "N/A"}</span>
        </div>

        {/* ADJUSTMENT → show "Transaction #XX" */}
        {tx.type === "adjustment" && (
          <div className="tx-row">
            <span>Adjusted For:</span>
            <span>Transaction #{tx.relatedId}</span>
          </div>
        )}

        {/* TRANSFER → show related user's name and utorid */}
        {tx.type === "transfer" && tx.relatedUser && (
          <div className="tx-row">
            <span>{amount < 0 ? "Sent To:" : "Received From:"}</span>
            <span>
              {tx.relatedUser.name} ({tx.relatedUser.utorid})
            </span>
          </div>
        )}

        {/* PURCHASE */}
        {tx.type === "purchase" && (
          <>
            <div className="tx-row">
              <span>Spent:</span>
              <span>${tx.spent?.toFixed(2)}</span>
            </div>
            {tx.promotionBonus && tx.promotionBonus > 0 && (
              <div className="tx-row tx-promotion-bonus">
                <span>🎉 Promotion Bonus:</span>
                <span className="tx-bonus-amount">+{tx.promotionBonus} points</span>
              </div>
            )}
          </>
        )}

        {/* REDEMPTION */}
        {tx.type === "redemption" && (
          <div className="tx-row">
            <span>Redeemed:</span>
            <span>{tx.redeemed} points</span>
          </div>
        )}

        {tx.remark && <p className="tx-remark">{tx.remark}</p>}
      </div>

      <span className="tx-date">
        {new Date(tx.createdAt).toLocaleString()}
      </span>
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

    default:
      return 0;
  }
}
