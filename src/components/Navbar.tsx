"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const appNavItems = [
  { href: "/dashboard", label: "Query Workspace" },
  { href: "/documents", label: "Documents" },
  { href: "/compare", label: "A/B Compare" },
  { href: "/evaluate", label: "Evaluation" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const isLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-gold-500 to-emerald-600 shadow-lg shadow-gold-500/20">
            <svg className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="absolute inset-0 rounded-lg bg-gold-400 opacity-0 blur transition-opacity duration-300 hover:opacity-40" />
          </div>
          <span className="font-semibold tracking-tight text-white bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-300 bg-clip-text text-transparent">RAG.Engine</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-gold-400 border border-zinc-700/50">v2.0</span>
        </Link>

        {/* Logged-in: app nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {appNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${isActive ? "text-white bg-zinc-900 border border-zinc-800" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40"}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Logged-out: landing nav */}
        {!user && isLanding && (
          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 rounded-lg transition-all">Features</a>
            <a href="#how-it-works" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 rounded-lg transition-all">How It Works</a>
            <a href="#strategies" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 rounded-lg transition-all">Strategies</a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/settings" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition">
              <div className="h-5 w-5 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold text-gold-400">
                {user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="font-medium max-w-[100px] truncate">{user.full_name || user.email}</span>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-all">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-gold-500 to-emerald-600 hover:from-gold-600 hover:to-emerald-700 shadow-lg shadow-gold-500/20 active:scale-[0.98] transition-all">
                Get Started
              </Link>
            </div>
          )}

          <button onClick={() => setIsOpen(!isOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white md:hidden transition" aria-label="Toggle menu">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-zinc-800/80 bg-zinc-950 px-6 py-4 space-y-2 animate-slide-down">
          {user ? (
            <>
              {appNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive ? "text-white bg-zinc-900 border border-zinc-800" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"}`}>
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/settings" onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 rounded-lg transition-all">Settings</Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 rounded-lg transition-all">Sign In</Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-gold-500 to-emerald-600 rounded-lg text-center">Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
