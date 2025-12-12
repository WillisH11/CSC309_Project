import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import "./Redeem.css";

export default function Redeem() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [points, setPoints] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async (e) => {
    e.preventDefault();
    setError("");

    if (!points || Number(points) <= 0) {
      setError("Please enter a valid number of points.");
      return;
    }

    if (Number(points) > user.points) {
      setError("You do not have enough points.");
      return;
    }

    try {
      setLoading(true);

      const data = await api.post("/users/me/transactions", {
        amount: Number(points),
        remark: "User redemption request"
      });

      // Refresh user data to update points before redirecting
      await refreshUser();

      // Successful → redirect to QR page
      navigate(`/redeem-qr/${data.id}`);

    } catch (err) {
      console.error(err);
      const errorMessage = err.message || err.error || "Something went wrong. Try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="redeem-container">
      <h1>Redeem Points</h1>
      <p>Enter the number of points you want to redeem.</p>

      <form className="redeem-form" onSubmit={handleRedeem}>
        <label>Points to Redeem</label>
        <input
          type="number"
          value={points}
          min="1"
          onChange={(e) => setPoints(e.target.value)}
        />

        {error && <p className="redeem-error">{error}</p>}

        <button type="submit" className="redeem-btn" disabled={loading}>
          {loading ? "Processing..." : "Redeem"}
        </button>
      </form>
    </div>
  );
}
