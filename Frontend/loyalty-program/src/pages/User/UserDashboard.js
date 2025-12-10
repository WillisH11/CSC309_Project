import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import PointsTimelineChart from "../../Components/Charts/PointsTimelineChart";
import PointsBreakdownChart from "../../Components/Charts/PointsBreakdownChart";
import "./UserDashboard.css";

export default function UserDashboard() {
  const { user, refreshUser } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        // Refresh user data to get latest points
        await refreshUser();
        
        // Load transactions
        const tx = await api.get("/users/me/transactions?limit=5&page=1");
        if (isMounted) {
          setRecentTransactions(tx.results || []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (loading || !user) {
    return (
      <div className="dashboard-container">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }
    // Fetch recent transactions for activity list
    api
      .get("/users/me/transactions?limit=5&page=1")
      .then((data) => setRecentTransactions(data.results || []))
      .catch((err) => console.error(err));

    // Fetch more transactions for charts (last 30 days worth)
    api
      .get("/users/me/transactions?limit=100&page=1")
      .then((data) => setAllTransactions(data.results || []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="dashboard-container">
      {/* BALANCE CARD */}
      <div className="balance-card">
        <h1>Welcome back, {user.name || user.utorid}!</h1>
        <p>Current Member Balance</p>
        <div className="balance-amount">{user.points ?? 0} pts</div>
      </div>

      {/* 2. ANALYTICS: Charts Grid */}
      <div className="charts-grid">
        {/* Points Timeline Chart */}
        <div className="chart-card">
          <h2 style={{ marginBottom: "1rem" }}>
            <i
              className="fas fa-chart-line"
              style={{ marginRight: "10px", color: "#FFA239" }}
            ></i>
            Your Points Journey
          </h2>
          <PointsTimelineChart
            transactions={allTransactions}
            currentPoints={user?.points || 0}
          />
        </div>

        {/* Points Breakdown Chart */}
        <div className="chart-card">
          <h2 style={{ marginBottom: "1rem" }}>
            <i
              className="fas fa-chart-pie"
              style={{ marginRight: "10px", color: "#FFA239" }}
            ></i>
            Where Your Points Came From
          </h2>
          <PointsBreakdownChart transactions={allTransactions} />
        </div>
      </div>

      {/* 4. STATUS: Recent Activity */}
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
              const isPendingRedemption = tx.type === "redemption" && tx.relatedId === null;
              const displayAmount =
                tx.type === "redemption" ? -tx.redeemed : tx.amount;

              const icon =
                tx.type === "purchase"
                  ? "fa-shopping-bag"
                  : tx.type === "transfer"
                  ? "fa-exchange-alt"
                  : tx.type === "redemption"
                  ? "fa-ticket-alt"
                  : "fa-gift";

              return (
                <div key={tx.id} className="activity-item">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
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
                      <strong
                        style={{
                          textTransform: "capitalize",
                          display: "block",
                        }}
                      >
                        {tx.type}
                        {isPendingRedemption && (
                          <span style={{ 
                            marginLeft: "8px", 
                            fontSize: "0.75rem", 
                            color: "#FFA239",
                            fontWeight: "normal",
                            fontStyle: "italic"
                          }}>
                            (Pending)
                          </span>
                        )}
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
                      opacity: isPendingRedemption ? 0.6 : 1,
                    }}
                  >
                    {displayAmount > 0 ? "+" : ""}
                    {displayAmount}
                    {isPendingRedemption && (
                      <div style={{ 
                        fontSize: "0.7rem", 
                        color: "#999",
                        fontWeight: "normal",
                        marginTop: "2px"
                      }}>
                        (Pending)
                      </div>
                    )}
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
