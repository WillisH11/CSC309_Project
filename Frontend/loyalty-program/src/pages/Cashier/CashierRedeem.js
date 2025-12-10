import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./Cashier.css";

export default function CashierRedeem() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending redemption requests
  async function loadRequests() {
    try {
      const data = await api.get("/transactions/redemption/pending");
      setRequests(data.results || []);
    } catch (err) {
      console.error("Failed loading redemption requests:", err);
    } finally {
      setLoading(false);
    }
  }

  // Approve redemption using backend PATCH route
  async function approveRequest(id) {
    try {
      await api.patch(`/transactions/${id}/processed`);

      // Remove from UI instantly
      setRequests(prev => prev.filter(req => req.id !== id));

      alert("Redemption approved!");
    } catch (err) {
      console.error("Approval error:", err);
      alert("Failed to approve redemption.");
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) return <h2 className="cashier-dashboard">Loading redemption requests...</h2>;

  return (
    <div className="cashier-dashboard">
      <h1>Approve Redemptions</h1>

      <div className="cashier-form-container">
        {requests.length === 0 ? (
          <p>No pending redemption requests.</p>
        ) : (
          <div>
            {requests.map(req => (
              <div key={req.id} className="redeem-card">
                
                <strong>User:</strong> {req.user?.utorid}
                <br />

                <strong>Redeemed:</strong> {(req.redeemed ?? req.amount)} pts
                <br />

                {req.remark && (
                  <>
                    <strong>Remark:</strong> {req.remark}
                    <br />
                  </>
                )}

                <strong>Submitted:</strong>{" "}
                {new Date(req.createdAt).toLocaleString()}
                <br />

                <button 
                  className="cashier-button"
                  onClick={() => approveRequest(req.id)}
                >
                  Approve Redemption
                </button>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
