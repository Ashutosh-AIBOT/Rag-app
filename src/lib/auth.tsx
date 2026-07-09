"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "./api";

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
  requestPasswordReset: (email: string) => Promise<any>;
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
      const res = await api.me();
      setUser(res as any);
    } catch {
      localStorage.removeItem("rag_token");
      document.cookie = "token=; path=/; max-age=0";
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    localStorage.setItem("rag_token", data.access_token);
    document.cookie = `token=${data.access_token}; path=/; max-age=${30*24*60*60}; SameSite=Lax`;
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, full_name: string) => {
    await api.register(email, password, full_name);
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem("rag_token");
    document.cookie = "token=; path=/; max-age=0";
    setToken(null);
    setUser(null);
  };

  const requestPasswordReset = async (email: string) => {
    return await api.forgotPassword(email);
  };

  const resetPassword = async (resetToken: string, newPassword: string) => {
    await api.resetPassword(resetToken, newPassword);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout,
      requestPasswordReset, resetPassword, changePassword,
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
