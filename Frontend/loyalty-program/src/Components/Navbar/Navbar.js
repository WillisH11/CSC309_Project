import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../../Contexts/AuthContext";

import {
  MenuItemsUser,
  MenuItemsCashier,
  MenuItemsManager,
  MenuItemsSuper,
  MenuItemsOrganizer,
} from "./NavbarMenus";

const Navbar = () => {
  const [clicked, setClicked] = useState(false);
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = () => setClicked(!clicked);

  const handleRoleChange = (e) => {
    setActiveRole(e.target.value);
    navigate("/dashboard");
  };

  let menu = MenuItemsUser;
  if (activeRole === "cashier") menu = MenuItemsCashier;
  else if (activeRole === "manager") menu = MenuItemsManager;
  else if (activeRole === "superuser") menu = MenuItemsSuper;
  else if (activeRole === "organizer") menu = MenuItemsOrganizer;
  if (!user) menu = [];

  return (
    <nav className="NavbarItems">
      <Link
        to="/dashboard"
        className="navbar-logo"
        onClick={() => setClicked(false)}
      >
        <span style={{ fontWeight: "400" }}>Cache</span>
        <span style={{ fontWeight: "800" }}>Back</span>
      </Link>

      <div className="menu-icon" onClick={handleClick}>
        <i className={clicked ? "fas fa-times" : "fas fa-bars"}></i>
      </div>

      <ul className={clicked ? "nav-menu active" : "nav-menu"}>
        {menu.map((item, index) => (
          <li key={index}>
            <Link
              className={item.cName}
              to={item.url}
              onClick={() => setClicked(false)}
            >
              {item.title}
            </Link>
          </li>
        ))}

        {user && (user.role !== "regular" || user.isOrganizer) && (
          <li>
            <select
              className="nav-links"
              value={activeRole}
              onChange={handleRoleChange}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <option value="regular">Regular View</option>

              {user.role === "cashier" && (
                <option value="cashier">Cashier Console</option>
              )}

              {(user.role === "manager" || user.isOrganizer) && (
                <option value="organizer">Organizer View</option>
              )}

              {user.role === "manager" && (
                <option value="manager">Manager Dashboard</option>
              )}

              {user.role === "superuser" && (
                <>
                  <option value="superuser">Superuser</option>
                  <option value="manager">Manager Dashboard</option>
                  <option value="cashier">Cashier Console</option>
                </>
              )}
            </select>
          </li>
        )}

        {user && (
          <>
            <li>
              <Link
                to="/profile"
                className="nav-links"
                onClick={() => setClicked(false)}
              >
                Profile
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  logout();
                  setClicked(false);
                }}
                className="nav-links"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </li>
          </>
        )}

        {!user && location.pathname !== "/login" && (
          <li>
            <Link
              to="/login"
              className="nav-links-mobile"
              onClick={() => setClicked(false)}
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
