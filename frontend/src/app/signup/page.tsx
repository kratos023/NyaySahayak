"use client";
// frontend/src/app/signup/page.tsx
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignupPage() {
  const { signup } = useAuth();
  const router     = useRouter();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const err = await signup(email, name, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-yellow-600 to-yellow-900
            flex items-center justify-center shadow-xl">
            <Scale size={26} className="text-yellow-100" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-[var(--gold-light)]">Nyay-Sahayak</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-[var(--bg-2)] border border-white/5 rounded-2xl p-6 space-y-4">

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Full Name</label>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="Deepanshu Sharma"
              className="w-full bg-[var(--bg-3)] border border-white/10 rounded-xl px-4 py-2.5
                text-sm text-gray-200 placeholder-gray-600 focus:outline-none
                focus:border-[var(--gold)]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[var(--bg-3)] border border-white/10 rounded-xl px-4 py-2.5
                text-sm text-gray-200 placeholder-gray-600 focus:outline-none
                focus:border-[var(--gold)]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
              Password <span className="text-gray-600 normal-case">(min 6 chars)</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} required value={password}
                onChange={e => setPassword(e.target.value)} minLength={6}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-3)] border border-white/10 rounded-xl px-4 py-2.5 pr-10
                  text-sm text-gray-200 placeholder-gray-600 focus:outline-none
                  focus:border-[var(--gold)]/50 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--gold)] text-black font-semibold text-sm
              hover:bg-[var(--gold-light)] disabled:opacity-50 transition-colors
              flex items-center justify-center gap-2 mt-2">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--gold-light)] hover:text-[var(--gold)] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
