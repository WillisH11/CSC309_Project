import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import "./Redeem.css";

export default function Redeem() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
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

      const res = await fetch("http://localhost:3002/users/me/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(points), remark : "User redemption request" })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Redemption failed.");
        setLoading(false);
        return;
      }

      // Successful → redirect to QR page
      navigate(`/redeem-qr/${data.id}`);

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
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
