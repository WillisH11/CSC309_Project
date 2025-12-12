import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./Cashier.css";
import MessageModal from "../../Components/MessageModal";

export default function CashierRedeem() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionId, setTransactionId] = useState("");
  const [manualError, setManualError] = useState("");

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  const showMessage = (title, message, type = "info") => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

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

      showMessage("Success", "Redemption approved successfully!", "success");
    } catch (err) {
      console.error("Approval error:", err);
      showMessage("Error", "Failed to approve redemption.", "error");
    }
  }

  // Process redemption by manually entered transaction ID
  async function processByTransactionId(e) {
    e.preventDefault();
    setManualError("");

    if (!transactionId || !transactionId.trim()) {
      setManualError("Please enter a transaction ID.");
      return;
    }

    const id = parseInt(transactionId.trim());
    if (isNaN(id) || id <= 0) {
      setManualError("Please enter a valid transaction ID.");
      return;
    }

    try {
      await api.patch(`/transactions/${id}/processed`);
      setTransactionId("");
      // Reload the list to refresh
      await loadRequests();
      // Show success modal (same as approve button)
      showMessage("Success", "Redemption approved successfully!", "success");
    } catch (err) {
      console.error("Process error:", err);
      const errorMessage = err.message || err.error || "Failed to process redemption.";
      showMessage("Error", errorMessage, "error");
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) return <h2 className="cashier-dashboard">Loading redemption requests...</h2>;

  return (
    <div className="cashier-dashboard">
      <h1>Approve Redemptions</h1>

      {/* Manual Transaction ID Input */}
      <div className="cashier-form-container" style={{ marginBottom: "2rem" }}>
        <h2 className="section-title">Process by Transaction ID</h2>
        <form onSubmit={processByTransactionId} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="transaction-id" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              Transaction ID:
            </label>
            <input
              id="transaction-id"
              type="number"
              className="cashier-form input"
              value={transactionId}
              onChange={(e) => {
                setTransactionId(e.target.value);
                setManualError("");
              }}
              placeholder="ID#"
              style={{ width: "100%", padding: "0.7rem", borderRadius: "8px", border: "2px solid var(--color-border)" }}
            />
          </div>
          <button
            type="submit"
            className="cashier-button"
            style={{ padding: "0.7rem 1.5rem", whiteSpace: "nowrap" }}
          >
            Process
          </button>
        </form>
        {manualError && (
          <div className="cashier-alert error" style={{ marginTop: "1rem" }}>
            {manualError}
          </div>
        )}
      </div>

      {/* Pending Redemption Requests List */}
      <h2 className="section-title">Pending Redemption Requests</h2>
      <div className="cashier-form-container">
        {requests.length === 0 ? (
          <p>No pending redemption requests.</p>
        ) : (
          <div>
            {requests.map(req => (
              <div key={req.id} className="redeem-card">
                
                <strong>Transaction ID:</strong> {req.id}
                <br />

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

      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
