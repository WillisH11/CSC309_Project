import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../Contexts/AuthContext";
import "./Transactions.css";

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get("/users/me/transactions?limit=20&page=1");

        if (Array.isArray(data.results)) {
          setTransactions(data.results);
        } else {
          console.warn("Unexpected transaction format:", data);
          setTransactions([]);
        }
      } catch (err) {
        console.error("API ERROR:", err);
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
    <div className="transactions-page">
      <h1>Your Transactions</h1>

      {transactions.length === 0 && <p>No transactions yet.</p>}

      <div className="transactions-list">
        {transactions.map((tx) => (
          <TransactionCard key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
}

function TransactionCard({ tx }) {
  return (
    <div className="transaction-card" style={{ borderLeftColor: "#ff9800" }}>
      <div className="tx-row">
        <span className="tx-type">{tx.type.toUpperCase()}</span>
        <span className="tx-amount">Redeemed: {tx.redeemed}</span>
      </div>

      <div className="tx-row">
        <span>
          Created By: <b>{tx.createdBy.utorid}</b>
        </span>
      </div>

      <p className="tx-remark">{tx.remark}</p>

      <span className="tx-date">
        {new Date(tx.createdAt).toLocaleString()}
      </span>
    </div>
  );
}
