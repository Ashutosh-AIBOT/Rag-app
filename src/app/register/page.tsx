"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/ui/Spinner";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await register(email, password, fullName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="card p-8 w-full max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-100">Account Created</h2>
          <p className="text-xs text-zinc-400">Your account has been created successfully. You can now sign in.</p>
          <Link href="/login" className="btn-primary inline-block">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-zinc-100">Create Account</h1>
          <p className="text-xs text-zinc-400">Join RAG.Engine to start exploring</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Full Name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="John Doe" />
          </div>
          <div className="space-y-1.5">
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="label">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" minLength={8} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Confirm Password</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>

          {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="h-4 w-4" /> Creating account...</span> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
