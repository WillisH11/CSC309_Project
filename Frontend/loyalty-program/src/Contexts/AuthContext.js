import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState("regular");

  // --Log in--
  const login = async (username, password) => {
    try {
      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await res.json();

      setUser(data.user);
      setActiveRole("regular");
      return { success: true };

    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // --Log out--
  const logout = async () => {
    await fetch("http://localhost:3001/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setActiveRole("regular");
  };

  // --Auto login on app load--
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("http://localhost:3001/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {}
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, activeRole, setActiveRole, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
