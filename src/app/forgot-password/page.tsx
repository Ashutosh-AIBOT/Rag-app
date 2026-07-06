"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/ui/Spinner";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [resetData, setResetData] = useState<{ token_debug?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await requestPasswordReset(email);
      setResetData(data);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="card p-8 w-full max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-100">Password Reset Request</h2>
          <p className="text-xs text-zinc-400">Password reset token generated successfully (SMTP/email is disabled).</p>
          {resetData?.token_debug && (
            <div className="p-4 bg-zinc-800/80 rounded-lg border border-zinc-700 text-left space-y-2">
              <p className="text-xs font-semibold text-zinc-300">Demo Mode Reset Details:</p>
              <div className="text-[11px] font-mono bg-zinc-950 p-2 rounded text-indigo-400 select-all break-all">
                Token: {resetData.token_debug}
              </div>
              <Link 
                href={`/reset-password?token=${resetData.token_debug}`} 
                className="btn-primary text-center block text-xs mt-2"
              >
                Reset Password Now
              </Link>
            </div>
          )}
          <div className="pt-2">
            <Link href="/login" className="btn-primary inline-block">Back to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-zinc-100">Forgot Password</h1>
          <p className="text-xs text-zinc-400">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
          </div>
          {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="h-4 w-4" /> Sending...</span> : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Remember your password? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
