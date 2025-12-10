import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./Transactions.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTx() {
      try {
        const res = await api.get("/users/me/transactions?limit=50&page=1");

        console.log("📌 API DATA:", res);

        if (Array.isArray(res.results)) {
          setTransactions(res.results);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error("❌ Transaction load error:", err);
        setError("Unable to load transactions");
      } finally {
        setLoading(false);
      }
    }

    loadTx();
  }, []);

  if (loading) return <p className="tx-loading">Loading...</p>;
  if (error) return <p className="tx-error">{error}</p>;
  if (transactions.length === 0)
    return <p className="tx-empty">No transactions found.</p>;

  return (
    <div className="tx-page">
      <h1 className="tx-title">Transaction History</h1>

      <div className="tx-list">
        {transactions.map((tx) => (
          <TxCard key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------
   CARD COMPONENT
--------------------------------*/
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
          <span>{tx.createdBy?.utorid}</span>
        </div>

        {tx.type === "purchase" && (
          <div className="tx-row">
            <span>Spent:</span>
            <span>${tx.spent?.toFixed(2)}</span>
          </div>
        )}

        {tx.type === "transfer" && (
          <div className="tx-row">
            <span>{amount < 0 ? "Sent To:" : "Received From:"}</span>
            <span>{tx.relatedUser?.utorid || tx.relatedId}</span>
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

/* ------------------------------
   AMOUNT CALCULATION LOGIC
--------------------------------*/
function computeAmount(tx) {
  switch (tx.type) {
    case "transfer":
      return tx.amount; // positive OR negative from backend

    case "purchase":
      return tx.amount; // usually +points earned

    case "redemption":
      return -tx.redeemed; // always negative

    default:
      return 0;
  }
}
