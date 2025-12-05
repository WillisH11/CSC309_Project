import React from "react";
import { Link } from "react-router-dom";
import "./Cashier.css"; // <--- Import the styles

export default function CashierDashboard() {
  return (
    <div className="cashier-dashboard">
      <h1>Cashier Terminal</h1>
      <p style={{ color: "#666" }}>Select an action to begin</p>

      <div className="cashier-options">
        <Link to="/cashier/create" className="cashier-card purchase">
          <i className="fas fa-cash-register"></i>
          <h3>New Purchase</h3>
          <span>Record a sale</span>
        </Link>

        <Link to="/cashier/redeem" className="cashier-card redeem">
          <i className="fas fa-qrcode"></i>
          <h3>Redeem</h3>
          <span>Process rewards</span>
        </Link>
      </div>
    </div>
  );
}
