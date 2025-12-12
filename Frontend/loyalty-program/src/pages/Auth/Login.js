import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import "./Login.css";
import "../../Components/Button.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError("");

    // Frontend validation
    if (!username.trim()) {
      setError("Please enter your UTORid.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    // Attempt login
    const result = await login(username, password);
    if (!result.success) {
      // Map backend errors to user-friendly messages
      const errorMessage = result.message;

      if (errorMessage.includes("Invalid credentials")) {
        setError("Invalid UTORid or password. Please try again.");
      } else if (errorMessage.includes("Missing required fields")) {
        setError("Please enter both UTORid and password.");
      } else if (errorMessage.includes("Session expired")) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(errorMessage || "Login failed. Please try again.");
      }
      return;
    }
    navigate("/dashboard");
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setError(""); // Clear error when user starts typing
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError(""); // Clear error when user starts typing
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>
        {error && (
          <div className="error-msg">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your UTORid"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--large"
            style={{ width: "100%" }}
          >
            Login
          </button>
        </form>

        <div className="login-footer">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
