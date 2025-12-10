import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./ManagerTransactions.css";
import { Link } from "react-router-dom";

export default function ManagerTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get("/transactions?limit=100&page=1");

        if (Array.isArray(res.results)) {
          setTransactions(res.results);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error("❌ Manager TX load error:", err);
        setError("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <p>Loading transactions...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="manager-tx-page">
      <h1>All Transactions</h1>

      <div className="manager-tx-list">
        {transactions.map((tx) => (
          <Link
            to={`/manager/transactions/${tx.id}`}
            key={tx.id}
            className={`manager-tx-card ${tx.type}`}
          >
            <div className="tx-header">
              <span className="tx-type">{tx.type.toUpperCase()}</span>

              <span
                className={`tx-amount ${
                  tx.amount >= 0 ? "positive" : "negative"
                }`}
              >
                {tx.amount > 0 ? "+" : ""}
                {tx.amount}
              </span>
            </div>

            <div className="tx-line">
              User: <b>{tx.user?.utorid}</b>
            </div>

            <div className="tx-line">
              Created by: <b>{tx.createdBy?.utorid}</b>
            </div>

            <div className="tx-date">
              {new Date(tx.createdAt).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
