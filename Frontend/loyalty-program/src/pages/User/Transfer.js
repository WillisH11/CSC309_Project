import React, { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../Contexts/AuthContext";
import "./Transfer.css";

export default function Transfer() {
  const { refreshUser } = useAuth();
  const [utorid, setUtorid] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LOOK UP USER
  async function lookupUser() {
    console.log("🔎 Lookup clicked. UTORid:", utorid);

    setError("");
    setRecipient(null);

    if (!utorid.trim()) {
      setError("Please enter a UTORid.");
      return;
    }

    try {
      const res = await api.get(`/users/search-transfer?utorid=${utorid}`);

      console.log("📌 RAW lookup response:", res);

      if (!res || !res.id) {
        console.log("❌ lookup returned invalid data");
        setError("User not found.");
        return;
      }

      console.log("✅ Lookup stored:", res);
      setRecipient(res);

    } catch (err) {
      console.error("❌ Lookup error:", err);
      setError("User not found.");
      setRecipient(null);
    }
  }

  // SUBMIT TRANSFER
  
  async function submitTransfer(e) {
    e.preventDefault();
    console.log("🚀 SubmitTransfer triggered");

    setError("");
    setSuccess("");

    if (!recipient) {
      setError("Lookup a valid recipient first.");
      return;
    }

    console.log("➡ Recipient object:", recipient);

    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    console.log(`➡ Sending POST to /users/${recipient.id}/transactions`);

    try {
      const res = await api.post(`/users/${recipient.id}/transactions`, {
        type: "transfer",
        amount: parseInt(amount),
        remark: remark || "",
      });

      console.log("✅ Transfer success:", res.data);

      // Refresh user data to update points
      await refreshUser();

      setSuccess(`Transferred ${amount} pts to ${recipient.utorid}!`);
      setUtorid("");
      setRecipient(null);
      setAmount("");
      setRemark("");

    } catch (err) {
      console.error("❌ Transfer failed:", err);

      // Extract backend error message:
      const msg =
        err?.message ||
        err?.response?.data?.error ||
        "Transfer failed.";

      // CUSTOM USER-FRIENDLY MESSAGES:
      if (msg.includes("Insufficient points")) {
        setError("You do not have enough points to complete this transfer.");
      } else if (msg.includes("Recipient not found")) {
        setError("The specified recipient does not exist.");
      } else if (msg.includes("Invalid amount")) {
        setError("Please enter a valid positive amount.");
      } else if (msg.includes("Cannot transfer to yourself")) {
        setError("You cannot transfer points to your own account.");
      } else {
        setError(msg);
      }
    }
  }


  return (
    <div className="transfer-container">
      <h1>Transfer Points</h1>

      {error && <div className="transfer-error">{error}</div>}
      {success && <div className="transfer-success">{success}</div>}

      {/* LOOKUP SECTION */}
      <div className="lookup-box">
        <label>Recipient UTORid</label>
        <input
          type="text"
          value={utorid}
          onChange={(e) => setUtorid(e.target.value)}
          placeholder="Enter UTORid"
        />

        <button type="button" className="lookup-button" onClick={lookupUser}>
          Lookup User
        </button>

        {recipient && (
          <div className="recipient-info">
            <strong>{recipient.name}</strong>
            <small>@{recipient.utorid}</small>
          </div>
        )}
      </div>

      {/* TRANSFER FORM */}
      <form className="transfer-form" onSubmit={submitTransfer}>
        <label>Amount</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label>Remark (optional)</label>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />

        <button type="submit" className="send-button">
          Send Points
        </button>
      </form>
    </div>
  );
}
