import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import "./Login.css";
import "../../Components/Button.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showActivation, setShowActivation] = useState(false);
  
  // Activation form state
  const [activationToken, setActivationToken] = useState("");
  const [activationUtorid, setActivationUtorid] = useState("");
  const [activationPassword, setActivationPassword] = useState("");
  const [activationPasswordConfirm, setActivationPasswordConfirm] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate("/dashboard");
  };

  const handleActivation = async (e) => {
    e.preventDefault();
    setActivationError("");
    setActivationSuccess(false);

    // Validation
    if (!activationToken || !activationUtorid || !activationPassword) {
      setActivationError("Please fill in all fields");
      return;
    }

    if (activationPassword !== activationPasswordConfirm) {
      setActivationError("Passwords do not match");
      return;
    }

    // Validate password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
    if (!passwordRegex.test(activationPassword)) {
      setActivationError("Password must be 8-20 characters with uppercase, lowercase, number, and special character");
      return;
    }

    setLoading(true);
    setActivationError("");
    try {
      const response = await api.post("/auth/activate", {
        activationToken: activationToken.trim(),
        utorid: activationUtorid.trim(),
        password: activationPassword
      });

      setActivationSuccess(true);
      // Clear form
      setActivationToken("");
      setActivationUtorid("");
      setActivationPassword("");
      setActivationPasswordConfirm("");
      
      // After 2 seconds, switch to login view
      setTimeout(() => {
        setShowActivation(false);
        setActivationSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Activation error:", err);
      let errorMessage = "Failed to activate account";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setActivationError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {!showActivation ? (
          <>
            <h1>Login</h1>
            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowActivation(true)}
                  className="forgot-password-link"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Activate Account
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1>Activate Account</h1>
            {activationError && <div className="error-msg">{activationError}</div>}
            {activationSuccess && (
              <div className="success-msg">
                Account activated successfully! Redirecting to login...
              </div>
            )}

            <form onSubmit={handleActivation} className="login-form">
              <div className="form-group">
                <label>Activation Token</label>
                <input
                  type="text"
                  value={activationToken}
                  onChange={(e) => setActivationToken(e.target.value)}
                  placeholder="Enter your activation token"
                  required
                />
              </div>

              <div className="form-group">
                <label>UTORid</label>
                <input
                  type="text"
                  value={activationUtorid}
                  onChange={(e) => setActivationUtorid(e.target.value)}
                  placeholder="Enter your UTORid"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={activationPassword}
                  onChange={(e) => setActivationPassword(e.target.value)}
                  placeholder="8-20 chars, uppercase, lowercase, number, special char"
                  required
                />
                <small style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "0.25rem", display: "block" }}>
                  Must contain: uppercase, lowercase, number, and special character (@$!%*?&#)
                </small>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={activationPasswordConfirm}
                  onChange={(e) => setActivationPasswordConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--large"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "Activating..." : "Activate Account"}
              </button>
            </form>

            <div className="login-footer">
              <button
                type="button"
                onClick={() => {
                  setShowActivation(false);
                  setActivationError("");
                  setActivationSuccess(false);
                }}
                className="forgot-password-link"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
