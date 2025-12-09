import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Auth.css";

export default function ResetPassword() {
  const { resetToken: tokenFromUrl } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    utorid: "",
    resetToken: tokenFromUrl || "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    // Validate password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
    if (!passwordRegex.test(formData.password)) {
      setError(
        "Password must be 8-20 characters with uppercase, lowercase, number, and special character (@$!%*?&#)"
      );
      setLoading(false);
      return;
    }

    try {
      await api.post(`/auth/resets/${formData.resetToken}`, {
        utorid: formData.utorid,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="reset-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Password Reset Successful!</h2>
            <p>Your password has been changed successfully.</p>
            <p className="redirect-message">
              <i className="fas fa-spinner fa-spin"></i> Redirecting to login page...
            </p>
            <Link to="/login" className="btn-auth">
              <i className="fas fa-sign-in-alt"></i> Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="utorid">
              <i className="fas fa-user"></i> UTORid
            </label>
            <input
              type="text"
              id="utorid"
              name="utorid"
              value={formData.utorid}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your UTORid"
            />
          </div>

          <div className="form-group">
            <label htmlFor="resetToken">
              <i className="fas fa-key"></i> Reset Token
            </label>
            <input
              type="text"
              id="resetToken"
              name="resetToken"
              value={formData.resetToken}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your reset token"
            />
            <small className="form-hint">
              The token you received from the forgot password page
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter new password"
            />
            <small className="form-hint">
              8-20 characters with uppercase, lowercase, number, and special character
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <i className="fas fa-lock"></i> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Confirm new password"
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
                <i className="fas fa-spinner fa-spin"></i> Resetting...
              </>
            ) : (
              <>
                <i className="fas fa-shield-alt"></i> Reset Password
              </>
            )}
          </button>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              <i className="fas fa-arrow-left"></i> Back to Login
            </Link>
            <span className="separator">|</span>
            <Link to="/forgot-password" className="auth-link">
              <i className="fas fa-redo"></i> Request New Token
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
