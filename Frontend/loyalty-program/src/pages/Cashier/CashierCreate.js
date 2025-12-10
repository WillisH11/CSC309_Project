import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./Cashier.css";

export default function CashierCreate() {
  const [utorid, setUtorid] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");

  const [promotions, setPromotions] = useState([]);
  const [autoPromos, setAutoPromos] = useState([]);
  const [oneTimePromos, setOneTimePromos] = useState([]);

  const [selectedOneTime, setSelectedOneTime] = useState("");

  const [basePoints, setBasePoints] = useState(0);
  const [autoBonus, setAutoBonus] = useState(0);
  const [oneTimeBonus, setOneTimeBonus] = useState(0);

  const [bestAutoPromo, setBestAutoPromo] = useState(null);
  const [oneTimeError, setOneTimeError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utorid]);

  async function loadPromotions() {
    try {
      // If customer UTORid is provided, filter promotions by their usage
      const params = utorid.trim() 
        ? { params: { customerUtorid: utorid.trim() } }
        : {};
      
      const res = await api.get("/promotions", params);
      const list = res.results || [];

      setPromotions(list);
      setAutoPromos(list.filter((p) => p.type === "automatic"));
      setOneTimePromos(list.filter((p) => p.type === "one-time"));
      
      // Clear selected one-time promo if it's no longer available
      if (selectedOneTime) {
        const stillAvailable = list.some((p) => p.id == selectedOneTime && p.type === "one-time");
        if (!stillAvailable) {
          setSelectedOneTime("");
          setOneTimeBonus(0);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load promotions.");
    }
  }

  //  POINT CALCULATIONS

  function updateAmount(value) {
    setAmount(value);
    const spent = Number(value);

    if (!spent || spent <= 0) {
      setBasePoints(0);
      setAutoBonus(0);
      setOneTimeBonus(0);
      return;
    }

    // base points: 1 point per 25 cents → 4 per $1, ROUND (A2 spec)
    const base = Math.round(spent * 4);
    setBasePoints(base);

    // ---------- Automatic promos ----------
    const eligible = autoPromos.filter(
      (p) => !p.minSpending || spent >= p.minSpending
    );

    let bestPromo = null;
    let bestBonus = 0;

    eligible.forEach((p) => {
      if (!p.rate) return;
      // bonus = spent * rate * 4 (base is 4 pts per $1)
      const bonus = Math.round(spent * (p.rate * 4));
      if (bonus > bestBonus) {
        bestBonus = bonus;
        bestPromo = p;
      }
    });

    setBestAutoPromo(bestPromo);
    setAutoBonus(bestBonus);

    // ---------- One-time promo ----------
    const ot = oneTimePromos.find((p) => p.id == selectedOneTime);

    if (ot && spent >= ot.minSpending) {
      setOneTimeBonus(ot.points);
    } else {
      setOneTimeBonus(0);
    }
  }

  // ONE-TIME SELECT HANDLER

  function handleOneTimeSelect(id) {
    setSelectedOneTime(id);

    const spent = Number(amount);
    if (!spent || spent <= 0) {
      setOneTimeBonus(0);
      return;
    }

    const promo = oneTimePromos.find((p) => p.id == id);

    if (promo && spent >= promo.minSpending) {
      setOneTimeBonus(promo.points);
    } else {
      setOneTimeBonus(0);
    }
  }

  // SUBMIT PURCHASE

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const promoIds = [];
    setOneTimeError("");

    // Add best auto promo
    if (bestAutoPromo) promoIds.push(bestAutoPromo.id);

    // Add selected one-time promo (validate min spending before submit)
    if (selectedOneTime) {
      const ot = oneTimePromos.find((p) => p.id == selectedOneTime);
      if (ot) {
        if (Number(amount) < ot.minSpending) {
          setOneTimeError(
            `Min spending $${ot.minSpending} required for ${ot.name}`
          );
          return;
        }
        promoIds.push(Number(selectedOneTime));
      }
    }

    try {
      const res = await api.post("/transactions", {
        type: "purchase",
        utorid: utorid.trim(),
        spent: Number(amount),
        remark,
        promotionIds: promoIds
      });

      setSuccess(`Created! Earned ${res.earned} points.`);

      // Reload promotions to reflect that customer has used the one-time promotion
      await loadPromotions();

      // reset fields (but keep UTORid so cashier can create another transaction for same customer)
      setAmount("");
      setRemark("");
      setSelectedOneTime("");
      setBasePoints(0);
      setAutoBonus(0);
      setOneTimeBonus(0);
    } catch (err) {
      console.error(err);
      // Extract error message from Error object or response data
      const errorMessage = err.message || err.error || "Failed to create purchase.";
      setError(errorMessage);
    }
  }

  const totalEarned = basePoints + autoBonus + oneTimeBonus;

  // UI
  
  return (
    <div className="cashier-page">
      <h1>Create Purchase</h1>

      {error && <div className="cashier-alert error">{error}</div>}
      {success && <div className="cashier-alert success">{success}</div>}
      {oneTimeError && <div className="cashier-alert error">{oneTimeError}</div>}

      <form className="cashier-form" onSubmit={handleSubmit}>
        {/* UTORID */}
        <label>Customer UTORid</label>
        <input
          type="text"
          value={utorid}
          onChange={(e) => setUtorid(e.target.value)}
          required
        />

        {/* SPENDING AMOUNT */}
        <label>Amount Spent ($)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => updateAmount(e.target.value)}
          required
        />

        {amount > 0 && (
          <div className="cashier-highlight">+ {basePoints} base points</div>
        )}

        {/* AUTO PROMO SECTION */}
        <h2 className="section-title">Automatic Promotion (best applied)</h2>

        {bestAutoPromo ? (
          <div className="promo-row">
            <strong>{bestAutoPromo.name}</strong> — {bestAutoPromo.rate * 100}% bonus
          </div>
        ) : (
          <p>No automatic promotions available.</p>
        )}

        {/* ONE-TIME PROMO SELECT */}
        <h2 className="section-title">One-Time Promotions</h2>

        <select
          className="promo-select"
          value={selectedOneTime}
          onChange={(e) => handleOneTimeSelect(e.target.value)}
        >
          <option value="">None</option>
          {oneTimePromos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.points} pts (min spend ${p.minSpending})
            </option>
          ))}
        </select>

        {/* TOTAL POINTS */}
        <div className="total-box">
          Total Earned: <strong>{totalEarned}</strong>
        </div>

        {/* REMARK */}
        <label>Remark (optional)</label>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />

        <button type="submit" className="cashier-submit-btn">
          Submit Purchase
        </button>
      </form>
    </div>
  );
}
