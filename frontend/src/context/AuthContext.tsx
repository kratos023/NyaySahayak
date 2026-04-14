"use client";
// frontend/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
  user_id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, name: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("nyay_token");
    const storedUser = localStorage.getItem("nyay_user");
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.detail || "Login failed";

      const u: User = { user_id: data.user_id, email: data.email, name: data.name, role: data.role };
      setToken(data.token);
      setUser(u);
      localStorage.setItem("nyay_token", data.token);
      localStorage.setItem("nyay_user", JSON.stringify(u));
      return null; // null = no error
    } catch {
      return "Server error. Is the backend running?";
    }
  }

  async function signup(email: string, name: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.detail || "Signup failed";

      const u: User = { user_id: data.user_id, email: data.email, name: data.name, role: data.role };
      setToken(data.token);
      setUser(u);
      localStorage.setItem("nyay_token", data.token);
      localStorage.setItem("nyay_user", JSON.stringify(u));
      return null;
    } catch {
      return "Server error. Is the backend running?";
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nyay_token");
    localStorage.removeItem("nyay_user");
    localStorage.removeItem("nyay_user_id");
    window.location.href = "/login";
  }

  return (
    <Ctx.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
