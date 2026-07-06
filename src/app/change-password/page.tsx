"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/ui/Spinner";

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
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
          <h1 className="text-xl font-bold text-zinc-100">Change Password</h1>
          <p className="text-xs text-zinc-400">Update your account password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <label className="label">New Password</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" placeholder="••••••••" minLength={8} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Confirm New Password</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>

          {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}
          {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">Password updated successfully!</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="h-4 w-4" /> Updating...</span> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
