import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState("regular");
  const [loading, setLoading] = useState(true);

  // --Log in--
  const login = async (utorid, password) => {
    try {
      // POST /auth/tokens
      const data = await api.post("/auth/tokens", { utorid, password });

      // Store the JWT token
      api.setToken(data.token);

      // Fetch user data with the new token
      const userData = await api.get("/users/me");

      // Set user data
      setUser(userData);
      setActiveRole(userData.role || "regular");

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // --Log out--
  const logout = () => {
    // Remove JWT token
    api.removeToken();

    // Clear user state
    setUser(null);
    setActiveRole("regular");
  };

  // --Auto login on app load--
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if token exists
        const token = api.getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // GET /users/me
        const data = await api.get("/users/me");
        setUser(data);
        setActiveRole(data.role || "regular");
      } catch (error) {
        // Token invalid or expired, remove it
        api.removeToken();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, activeRole, setActiveRole, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
