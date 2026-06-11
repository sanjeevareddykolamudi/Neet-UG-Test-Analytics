import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginGoogle: (idToken: string) => Promise<void>;
  loginDemo: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to check active auth session:", err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const loginGoogle = async (idToken: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Google login failed");
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (email?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Demo login failed");
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      window.location.href = "/sign-in";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginGoogle, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
