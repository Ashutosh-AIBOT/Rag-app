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
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimeout) clearTimeout(errorTimeout);
    const timeout = setTimeout(() => {
      setError("");
    }, 5000);
    setErrorTimeout(timeout);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "", text: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
    if (score <= 4) return { score, label: "Medium", color: "bg-amber-500", text: "text-amber-400" };
    return { score, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
  };

  const strength = getPasswordStrength(password);

  const criteria = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", met: /[a-z]/.test(password) },
    { label: "At least one number", met: /[0-9]/.test(password) },
    { label: "At least one special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (errorTimeout) clearTimeout(errorTimeout);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    // 1. Full name validation
    if (trimmedName.length < 2) {
      showError("Full name must be at least 2 characters long");
      return;
    }

    // 2. Email validation
    if (!trimmedEmail) {
      showError("Email address is required");
      return;
    }

    if (/\s/.test(trimmedEmail)) {
      showError("Email address cannot contain spaces");
      return;
    }

    // Prevents consecutive symbols/dots
    if (
      trimmedEmail.includes("..") ||
      trimmedEmail.includes("__") ||
      trimmedEmail.includes("--") ||
      trimmedEmail.includes("@.") ||
      trimmedEmail.includes(".@")
    ) {
      showError("Email contains invalid character sequences");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      showError("Please enter a valid email address (e.g., name@domain.com)");
      return;
    }

    const parts = trimmedEmail.split("@");
    const localPart = parts[0]?.toLowerCase() || "";
    const domainPart = parts[1]?.toLowerCase() || "";

    // Reject common disposable/temp email domains
    const disposableDomains = [
      "mailinator.com", "yopmail.com", "trashmail.com", "tempmail.com",
      "10minutemail.com", "dispostable.com", "guerrillamail.com", "sharklasers.com",
      "getairmail.com", "burnercmail.com", "temp-mail.org", "fakeinbox.com",
      "mailnesia.com", "maildrop.cc", "throwawaymail.com", "generator.email",
      "tempmailaddress.com", "smartemail.com"
    ];
    if (disposableDomains.includes(domainPart)) {
      showError("Disposable/temporary email addresses are not allowed");
      return;
    }

    // Reject obvious fake/dummy placeholder emails
    const blockedEmails = [
      "test@test.com", "admin@admin.com", "fake@fake.com", "dummy@dummy.com",
      "me@me.com", "a@a.com", "user@user.com", "noreply@example.com", "no-reply@example.com"
    ];
    if (blockedEmails.includes(trimmedEmail.toLowerCase())) {
      showError("Please use a real, personal email address");
      return;
    }

    const dummyPrefixes = ["test", "fake", "dummy", "admin", "asd", "asdf", "qwerty", "user", "noreply", "no-reply"];
    if (dummyPrefixes.includes(localPart) && (domainPart === "test.com" || domainPart === "example.com" || domainPart === "fake.com" || domainPart === "dummy.com" || domainPart === "admin.com")) {
      showError("Please use a real, personal email address");
      return;
    }

    // 3. Password strength validation
    if (password.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      showError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      showError("Password must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      showError("Password must contain at least one special character");
      return;
    }

    // 4. Confirm password validation
    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(trimmedEmail, password, trimmedName);
      setSuccess(true);
    } catch (err: any) {
      showError(err.message);
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-field" 
              placeholder="••••••••" 
            />
            {password && (
              <div className="space-y-2 mt-2 p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg animate-in">
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strength.color}`} 
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="text-zinc-500">Strength</span>
                  <span className={strength.text}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-1 gap-1 pt-2 border-t border-zinc-900">
                  {criteria.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <svg 
                        className={`h-3.5 w-3.5 transition-colors duration-200 ${item.met ? "text-emerald-500" : "text-zinc-600"}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {item.met ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      <span className={`transition-colors duration-200 ${item.met ? "text-zinc-300" : "text-zinc-500"}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          Already have an account? <Link href="/login" className="text-gold-400 hover:text-gold-300 transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
