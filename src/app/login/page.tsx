"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/ui/Spinner";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-zinc-100">Welcome Back</h1>
          <p className="text-xs text-zinc-400">Sign in to your RAG.Engine account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="label">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>

          {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="h-4 w-4" /> Signing in...</span> : "Sign In"}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 space-y-2">
          <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300 transition">Forgot password?</Link>
          <p>Don't have an account? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}
