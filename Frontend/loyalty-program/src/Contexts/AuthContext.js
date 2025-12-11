import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState("regular");
  const [loading, setLoading] = useState(true);

  //keep token in state
  const [token, setToken] = useState(api.getToken());

  // --Log in--
  const login = async (utorid, password) => {
    try {
      const data = await api.post("/auth/tokens", { utorid, password });

      api.setToken(data.token);
      setToken(data.token);        //store token in state
      if (data.csrfToken) {
        localStorage.setItem("csrfToken", data.csrfToken);
      }

      const userData = await api.get("/users/me");

      setUser(userData);
      setActiveRole(userData.role || "regular");

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // --Log out--
  const logout = () => {
    api.removeToken();
    localStorage.removeItem("csrfToken");
    setToken(null);                // ⬅️ clear token

    setUser(null);
    setActiveRole("regular");
  };

  // --Refresh user data--
  const refreshUser = async () => {
    try {
      const data = await api.get("/users/me");
      setUser(data);
      // Don't reset activeRole - preserve user's selected role view
      // Only update activeRole on initial load (when it's null or matches the default)
      // This allows users to switch between role views without losing their selection
      return data;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return null;
    }
  };

  // --Auto login--
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedToken = api.getToken();
        if (!savedToken) {
          setLoading(false);
          return;
        }

        setToken(savedToken);       // restore token

        const data = await api.get("/users/me");
        setUser(data);
        setActiveRole(data.role || "regular");
      } catch (error) {
        api.removeToken();
        localStorage.removeItem("csrfToken");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        setActiveRole,
        login,
        logout,
        refreshUser,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
