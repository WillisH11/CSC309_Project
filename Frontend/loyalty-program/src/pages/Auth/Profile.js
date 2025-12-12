import { useState, useEffect } from "react";
import { useAuth } from "../../Contexts/AuthContext";
import api from "../../services/api";
import "../../Components/Button.css";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    birthday: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  // UI state
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        birthday: user.birthday || "",
      });
    }
  }, [user]);

  // Handle profile field changes
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
    setProfileMessage("");
    setProfileError("");
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setPasswordMessage("");
    setPasswordError("");
  };

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileMessage("");

    try {
      // Only send fields that changed
      const updates = {};
      if (profileData.name !== user.name) updates.name = profileData.name;
      if (profileData.email !== user.email) updates.email = profileData.email;
      if (profileData.birthday !== user.birthday) updates.birthday = profileData.birthday;

      if (Object.keys(updates).length === 0) {
        setProfileMessage("No changes to save");
        setProfileLoading(false);
        return;
      }

      await api.patch("/users/me", updates);

      // Refresh user data by reloading the page
      setProfileMessage("Profile updated successfully! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordMessage("");

    // Validate passwords match
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("New passwords don't match");
      setPasswordLoading(false);
      return;
    }

    // Validate new password is different from old password
    if (passwordData.old === passwordData.new) {
      setPasswordError("New password must be different from current password");
      setPasswordLoading(false);
      return;
    }

    // Validate password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
    if (!passwordRegex.test(passwordData.new)) {
      setPasswordError(
        "Password must be 8-20 characters with uppercase, lowercase, number, and special character (@$!%*?&#)"
      );
      setPasswordLoading(false);
      return;
    }

    try {
      await api.patch("/users/me/password", {
        old: passwordData.old,
        new: passwordData.new,
      });

      setPasswordMessage("Password changed successfully!");
      setPasswordData({ old: "", new: "", confirm: "" });
    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>

      <div className="profile-layout">
        {/* Main Profile Card */}
        <div className="profile-main-card">
          <div className="profile-header">
            <div className="profile-header-content">
              <div className="profile-avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  <i className="fas fa-user-circle"></i>
                )}
              </div>
              <div className="profile-header-info">
                <h2>{user.name}</h2>
                <p className="profile-utorid">@{user.utorid}</p>
                <div className="profile-badges">
                  <span className="role-badge">{user.role}</span>
                  <span className="points-badge">
                    <i className="fas fa-star"></i> {user.points} pts
                  </span>
                  <span className={user.verified ? "status-verified" : "status-unverified"}>
                    {user.verified ? (
                      <>
                        <i className="fas fa-check-circle"></i> Verified
                      </>
                    ) : (
                      <>
                        <i className="fas fa-exclamation-circle"></i> Unverified
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-section-title">
              <i className="fas fa-user-edit"></i> Personal Information
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                  minLength={1}
                  maxLength={50}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthday">Birthday</label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={profileData.birthday}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
                className="form-input"
                placeholder="name@mail.utoronto.ca"
              />
              <small className="form-hint">Must be a UofT email address</small>
            </div>

            {profileMessage && (
              <div className="message-success">
                <i className="fas fa-check-circle"></i> {profileMessage}
              </div>
            )}

            {profileError && (
              <div className="message-error">
                <i className="fas fa-exclamation-circle"></i> {profileError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={profileLoading}
            >
              {profileLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change Card (Smaller) */}
        <div className="profile-side-card">
          <div className="side-card-header">
            <i className="fas fa-lock"></i>
            <h3>Change Password</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="password-fields">
              <div className="form-group">
                <label htmlFor="old">Current Password</label>
                <input
                  type="password"
                  id="old"
                  name="old"
                  value={passwordData.old}
                  onChange={handlePasswordChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new">New Password</label>
                <input
                  type="password"
                  id="new"
                  name="new"
                  value={passwordData.new}
                  onChange={handlePasswordChange}
                  required
                  className="form-input"
                />
                <small className="form-hint">
                  8-20 characters with uppercase, lowercase, number, and special character
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirm">Confirm Password</label>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  value={passwordData.confirm}
                  onChange={handlePasswordChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="password-actions">
              {passwordMessage && (
                <div className="message-success">
                  <i className="fas fa-check-circle"></i> {passwordMessage}
                </div>
              )}

              {passwordError && (
                <div className="message-error">
                  <i className="fas fa-exclamation-circle"></i> {passwordError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn--outline"
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-shield-alt"></i> Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
