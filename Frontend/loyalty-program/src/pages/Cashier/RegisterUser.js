import { useState } from "react";
import api from "../../services/api";
import "./RegisterUser.css";
import "../../Components/Button.css";

export default function RegisterUser() {
  const [formData, setFormData] = useState({
    utorid: "",
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

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
    setSuccess(null);

    try {
      const result = await api.post("/users", formData);

      setSuccess({
        user: result,
        resetToken: result.resetToken,
      });

      // Reset form
      setFormData({
        utorid: "",
        name: "",
        email: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create user account");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setSuccess(null);
    setError("");
  };

  return (
    <div className="register-user-container">
      <div className="register-header">
        <h1><i className="fas fa-user-plus"></i> Register New User</h1>
        <p className="header-description">
          Create a new user account. The user will receive an activation token to set their password.
        </p>
      </div>

      {success ? (
        <div className="success-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Account Created Successfully!</h2>

          <div className="user-info-display">
            <div className="info-row">
              <label>Name:</label>
              <p>{success.user.name}</p>
            </div>
            <div className="info-row">
              <label>UTORid:</label>
              <p>@{success.user.utorid}</p>
            </div>
            <div className="info-row">
              <label>Email:</label>
              <p>{success.user.email}</p>
            </div>
          </div>

          <div className="token-section">
            <h3><i className="fas fa-key"></i> Activation Token</h3>
            <p className="token-instruction">
              Provide this token to the user so they can set their password:
            </p>
            <div className="token-display">
              <code>{success.resetToken}</code>
            </div>
            <p className="token-expiry">
              <i className="fas fa-clock"></i> Token expires in 7 days
            </p>
          </div>

          <div className="success-actions">
            <button className="btn btn--primary" onClick={handleCreateAnother}>
              <i className="fas fa-plus"></i> Register Another User
            </button>
          </div>
        </div>
      ) : (
        <div className="register-form-card">
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="utorid">
                  <i className="fas fa-id-card"></i> UTORid
                </label>
                <input
                  type="text"
                  id="utorid"
                  name="utorid"
                  value={formData.utorid}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9]{7,8}"
                  placeholder="e.g., smithj12"
                  className="form-input"
                  autoFocus
                />
                <small className="form-hint">7-8 alphanumeric characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  <i className="fas fa-user"></i> Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={1}
                  maxLength={50}
                  placeholder="e.g., John Smith"
                  className="form-input"
                />
                <small className="form-hint">1-50 characters</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i> Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="name@mail.utoronto.ca"
                className="form-input"
              />
              <small className="form-hint">Must be a UofT email address (@mail.utoronto.ca or @utoronto.ca)</small>
            </div>

            {error && (
              <div className="message-error">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i> Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
