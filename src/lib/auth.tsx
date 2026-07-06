"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_URL } from "./api";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("rag_token");
    if (saved) {
      setToken(saved);
      fetchUser(saved);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (tk: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        localStorage.removeItem("rag_token");
        document.cookie = "token=; path=/; max-age=0";
    setToken(null);
      }
    } catch {
      // Auth backend not available — continue without auth
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("rag_token", data.access_token);
    document.cookie = `token=${data.access_token}; path=/; max-age=${30*24*60*60}; SameSite=Lax`;
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, full_name: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("rag_token");
    document.cookie = "token=; path=/; max-age=0";
    setToken(null);
    setUser(null);
  };

  const requestOtp = async (email: string) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to send OTP");
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) throw new Error("Invalid OTP");
  };

  const requestPasswordReset = async (email: string) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to send reset email");
    return await res.json();
  };

  const resetPassword = async (resetToken: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, new_password: newPassword }),
    });
    if (!res.ok) throw new Error("Password reset failed");
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (!res.ok) throw new Error("Password change failed");
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout,
      requestOtp, verifyOtp, requestPasswordReset, resetPassword, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
