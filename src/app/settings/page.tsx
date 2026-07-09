"use client";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">Manage your account settings and preferences.</p>
      </div>

      <div className="card p-6 space-y-6 max-w-lg">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-100">Account</h3>
          {user ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Email</span>
                <span className="text-zinc-200 font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Name</span>
                <span className="text-zinc-200 font-medium">{user.full_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Role</span>
                <span className="badge-gold">{user.is_admin ? "Admin" : "User"}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Not signed in. <Link href="/login" className="text-gold-400 hover:text-gold-300">Sign in</Link></p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-100">Security</h3>
          <Link href="/change-password" className="btn-ghost block text-left">Change Password</Link>
        </div>

        {user && (
          <button onClick={logout} className="btn-danger">Sign Out</button>
        )}
      </div>
    </div>
  );
}
