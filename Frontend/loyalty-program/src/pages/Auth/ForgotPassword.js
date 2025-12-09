import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Auth.css";

export default function ForgotPassword() {
  const [utorid, setUtorid] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetToken("");

    try {
      const data = await api.post("/auth/resets", { utorid });
      setResetToken(data.resetToken);
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your UTORid to reset your password</p>
        </div>

        {!resetToken ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="utorid">
                <i className="fas fa-user"></i> UTORid
              </label>
              <input
                type="text"
                id="utorid"
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
                required
                className="form-input"
                placeholder="Enter your UTORid"
                autoFocus
              />
            </div>

            {error && (
              <div className="message-error">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Request Reset
                </>
              )}
            </button>

            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                <i className="fas fa-arrow-left"></i> Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div className="reset-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Reset Token Generated</h2>
            <p>Your password reset token is:</p>
            <div className="token-display">
              <code>{resetToken}</code>
            </div>
            <div className="reset-instructions">
              <p>
                <i className="fas fa-info-circle"></i> Copy this token and use it on the
                password reset page. This token will expire in 1 hour.
              </p>
            </div>
            <Link to={`/reset-password/${resetToken}`} className="btn-auth">
              <i className="fas fa-key"></i> Reset Password Now
            </Link>
            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                <i className="fas fa-arrow-left"></i> Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
