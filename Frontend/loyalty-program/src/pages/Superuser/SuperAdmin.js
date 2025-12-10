import { Link } from "react-router-dom";
import "../Manager/Manager.css";

export default function SuperAdmin() {
  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>
          <i className="fas fa-user-shield"></i> Superuser Dashboard
        </h1>
        <p style={{ color: "#666" }}>
          Complete system control - manage all resources and elevate user privileges.
        </p>
      </div>

      <div className="manager-dashboard-grid">
        {/* User Management */}
        <Link to="/manager/users" className="manager-card card-users">
          <div>
            <i className="fas fa-users-cog"></i>
            <h2>User Management</h2>
            <p>
              Verify accounts, manage roles (including manager/superuser), and handle suspicious users.
            </p>
          </div>
        </Link>

        {/* System Transactions */}
        <Link to="/manager/transactions" className="manager-card card-transactions">
          <div>
            <i className="fas fa-list-alt"></i>
            <h2>System Transactions</h2>
            <p>
              View complete history of all purchases, transfers, and redemptions across the system.
            </p>
          </div>
        </Link>

        {/* Events & Promotions */}
        <Link to="/manager/events" className="manager-card card-content">
          <div>
            <i className="fas fa-calendar-alt"></i>
            <h2>Events & Promotions</h2>
            <p>
              Full control over events, manage organizers, and publish promotional offers.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
