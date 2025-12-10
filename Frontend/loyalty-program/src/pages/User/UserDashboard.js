import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import "./UserDashboard.css";

export default function UserDashboard() {
  const { user, setUser } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadDashboard() {
    try {
      // ONLY load transactions here
      const tx = await api.get("/users/me/transactions?limit=5&page=1");
      setRecentTransactions(tx.results || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  loadDashboard();
}, []);

  if (loading || !user) {
    return (
      <div className="dashboard-container">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      {/* BALANCE CARD */}
      <div className="balance-card">
        <h1>Welcome back, {user.name || user.utorid}!</h1>
        <p>Current Member Balance</p>
        <div className="balance-amount">{user.points ?? 0} pts</div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="recent-activity">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>Recent Activity</h2>

          <Link
            to="/transactions"
            style={{
              color: "#FFA239",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            View Full History →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic", padding: "1rem 0" }}>
            No recent activity to show.
          </p>
        ) : (
          <div>
            {recentTransactions.map((tx) => {
              const displayAmount =
                tx.type === "redemption"
                  ? -tx.redeemed
                  : tx.amount;

              const icon =
                tx.type === "purchase"
                  ? "fa-shopping-bag"
                  : tx.type === "transfer"
                  ? "fa-exchange-alt"
                  : "fa-gift";

              return (
                <div key={tx.id} className="activity-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div
                      style={{
                        background: "#f0f0f0",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                      }}
                    >
                      <i className={`fas ${icon}`}></i>
                    </div>

                    <div>
                      <strong style={{ textTransform: "capitalize", display: "block" }}>
                        {tx.type}
                      </strong>
                      <small style={{ color: "#999" }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  <div
                    className={displayAmount > 0 ? "positive" : "negative"}
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      minWidth: "50px",
                      textAlign: "right",
                    }}
                  >
                    {displayAmount > 0 ? "+" : ""}
                    {displayAmount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
