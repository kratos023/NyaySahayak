"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/");
  }

  const inputCls = `w-full rounded-xl px-4 py-3 text-[0.875rem] text-[var(--text)]
    placeholder:text-[var(--text-3)] border focus:outline-none transition-all duration-200
    focus:border-[var(--gold)]/50`;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--bg)" }}>

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-96 h-96 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--gold-light) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-sm px-4 space-y-8 animate-fade-up">

        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-30"
              style={{ background: "var(--gold)" }} />
            <div className="relative w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #b45309, #78350f)",
                       border: "1px solid rgba(201,146,10,0.4)" }}>
              <Scale size={28} className="text-amber-100" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-3xl text-gold-gradient">Nyay-Sahayak</h1>
            <p className="text-[0.78rem] text-[var(--text-3)] mt-1">Sign in to continue</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border-md)" }}>

          {error && (
            <div className="px-4 py-3 rounded-xl text-[0.8rem] text-red-300 animate-scale-in"
              style={{ background: "rgba(127,29,29,0.3)", border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] text-[var(--text-3)] uppercase tracking-widest block">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls} style={{ background: "var(--bg-3)", borderColor: "var(--border-md)" }} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.65rem] text-[var(--text-3)] uppercase tracking-widest block">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                  style={{ background: "var(--bg-3)", borderColor: "var(--border-md)" }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-[0.875rem] font-semibold transition-all
                active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: "linear-gradient(135deg, var(--gold) 0%, #b45309 100%)", color: "#000" }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-[0.8rem] text-[var(--text-3)]">
          New here?{" "}
          <Link href="/signup" className="text-[var(--gold-light)] hover:text-[var(--gold)] transition-colors font-medium">
            Create an account
          </Link>
        </p>

        <p className="text-center text-[0.62rem] text-[var(--text-3)] opacity-50">
        </p>
      </div>
    </div>
  );
}
