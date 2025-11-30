import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../../Contexts/AuthContext";

// Import menu definitions for each role
import { MenuItemsUser, MenuItemsCashier, MenuItemsManager, MenuItemsSuper } from "./NavbarMenus";

const Navbar = () => {
  const [clicked, setClicked] = useState(false);
  const { user, activeRole, setActiveRole, logout } = useAuth();

  const handleClick = () => setClicked(!clicked);

  // Select correct menu based on role
  let menu = MenuItemsUser;
  if (activeRole === "cashier") menu = MenuItemsCashier;
  else if (activeRole === "manager") menu = MenuItemsManager;
  else if (activeRole === "superuser") menu = MenuItemsSuper;

  return (
    <nav className="NavbarItems">
      <h1 className="navbar-logo">
        LoyalApp<i className="fab fa-react"></i>
      </h1>

      {/* Mobile menu icon */}
      <div className="menu-icon" onClick={handleClick}>
        <i className={clicked ? "fas fa-times" : "fas fa-bars"}></i>
      </div>

      {/* Main nav links */}
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

        {/* Only show role switcher if user has elevated roles */}
        {user && (
          <li>
            <select
              className="nav-links"
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              <option value="regular">Regular</option>
              {user.role === "cashier" && <option value="cashier">Cashier</option>}
              {user.role === "manager" && (
                <>
                  <option value="manager">Manager</option>
                  <option value="organizer">Organizer</option>
                </>
              )}
              {user.role === "superuser" && (
                <>
                  <option value="superuser">Superuser</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </>
              )}
            </select>
          </li>
        )}

        {/* Profile and Log buttons */}
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
                  cursor: "pointer"
                }}
              >
                Logout
              </button>
            </li>
          </>
        )}

        {/* Show Log in if no user */}
        {!user && (
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
