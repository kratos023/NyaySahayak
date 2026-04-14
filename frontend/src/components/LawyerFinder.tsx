"use client";
// frontend/src/components/LawyerFinder.tsx
import { useState } from "react";
import { X, Search, ExternalLink, Shield, Phone, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Spec { id: string; icon: string; label: string; hindi: string; }
interface SearchResult {
  location: string;
  specialization: Spec;
  search_links: { label: string; url: string; desc: string }[];
  state_council: { name: string; phone: string; website: string; state: string } | null;
  free_legal_aid: {
    name: string; desc: string; how: string;
    eligibility: string[]; nalsa_phone: string; nalsa_website: string; tele_law: string;
  };
  tips: string[];
}

const INDIAN_LANGUAGES = [
  "English","Hindi","Bengali","Telugu","Marathi",
  "Tamil","Gujarati","Kannada","Malayalam","Punjabi","Odia"
];

interface Props { onClose: () => void; language: string; }

export default function LawyerFinder({ onClose, language }: Props) {
  const [location, setLocation]   = useState("");
  const [specId, setSpecId]       = useState("criminal");
  const [langPref, setLangPref]   = useState(language);
  const [result, setResult]       = useState<SearchResult | null>(null);
  const [specs, setSpecs]         = useState<Spec[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loadedSpecs, setLoadedSpecs] = useState(false);
  const [freeAid, setFreeAid]     = useState<SearchResult["free_legal_aid"] | null>(null);
  const [tab, setTab]             = useState<"search" | "free">("search");

  // Load specializations on first render
  if (!loadedSpecs) {
    setLoadedSpecs(true);
    fetch(`${API}/api/lawyers/specializations`)
      .then(r => r.json())
      .then(d => setSpecs(d.specializations || []))
      .catch(() => {});
    fetch(`${API}/api/lawyers/free-aid`)
      .then(r => r.json())
      .then(d => setFreeAid(d))
      .catch(() => {});
  }

  async function handleSearch() {
    if (!location.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/lawyers/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim(), specialization: specId, language_pref: langPref }),
      });
      setResult(await res.json());
    } catch { }
    setLoading(false);
  }

  const inputCls = `w-full rounded-xl px-3 py-2.5 text-[0.875rem] border focus:outline-none transition-all`;
  const inputStyle = { background: "var(--bg-3)", borderColor: "rgba(255,255,255,0.1)", color: "var(--text)" };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div>
          <h2 className="font-display text-xl" style={{ color: "var(--gold-light)" }}>
            👨‍⚖️ Find a Lawyer
          </h2>
          <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--text-3)" }}>
            Vakeel Dhundhna — local advocates + free legal aid
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--text-3)" }}>
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {[
          { id: "search", label: "Find a Lawyer" },
          { id: "free",   label: "Free Legal Aid" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="flex-1 py-2.5 text-[0.78rem] transition-colors"
            style={tab === t.id
              ? { color: "var(--gold-light)", borderBottom: "2px solid var(--gold)" }
              : { color: "var(--text-3)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── Search tab ── */}
        {tab === "search" && (
          <>
            {/* Search form */}
            <div className="space-y-3">
              <div>
                <label className="text-[0.65rem] uppercase tracking-widest mb-1.5 block"
                  style={{ color: "var(--text-3)" }}>Your Location *</label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. Lajpat Nagar, Delhi"
                  className={inputCls} style={inputStyle} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] uppercase tracking-widest mb-1.5 block"
                    style={{ color: "var(--text-3)" }}>Specialization</label>
                  <select value={specId} onChange={e => setSpecId(e.target.value)}
                    className={inputCls} style={inputStyle}>
                    {specs.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[0.65rem] uppercase tracking-widest mb-1.5 block"
                    style={{ color: "var(--text-3)" }}>Language Preference</label>
                  <select value={langPref} onChange={e => setLangPref(e.target.value)}
                    className={inputCls} style={inputStyle}>
                    {INDIAN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleSearch} disabled={!location.trim() || loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                  flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--gold), #b45309)", color: "#000" }}>
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Searching…</>
                  : <><Search size={14} /> Find Lawyers</>}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-4 animate-fade-up">
                <p className="text-[0.72rem]" style={{ color: "var(--text-3)" }}>
                  Showing results for <span style={{ color: "var(--gold-light)" }}>{result.location}</span>
                  {" · "}{result.specialization.icon} {result.specialization.label}
                </p>

                {/* Search links */}
                <div className="space-y-2.5">
                  {result.search_links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start justify-between gap-3 p-3.5 rounded-xl
                        transition-all hover:scale-[1.01] group"
                      style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                      <div className="min-w-0">
                        <p className="text-[0.82rem] font-medium transition-colors"
                          style={{ color: "var(--text)" }}>
                          {link.label}
                        </p>
                        <p className="text-[0.7rem] mt-0.5" style={{ color: "var(--text-3)" }}>
                          {link.desc}
                        </p>
                      </div>
                      <ExternalLink size={13} className="flex-shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--gold-light)" }} />
                    </a>
                  ))}
                </div>

                {/* State Bar Council */}
                {result.state_council && (
                  <div className="rounded-xl p-4"
                    style={{ background: "rgba(201,146,10,0.06)", border: "1px solid rgba(201,146,10,0.2)" }}>
                    <p className="text-[0.65rem] uppercase tracking-widest mb-2 flex items-center gap-1.5"
                      style={{ color: "var(--gold)" }}>
                      <Shield size={10} /> State Bar Council
                    </p>
                    <p className="text-[0.82rem] font-medium" style={{ color: "var(--text)" }}>
                      {result.state_council.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Phone size={11} style={{ color: "var(--text-3)" }} />
                      <p className="text-[0.78rem] font-mono" style={{ color: "var(--gold-light)" }}>
                        {result.state_council.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="rounded-xl p-4" style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
                  <p className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-3)" }}>
                    💡 Tips
                  </p>
                  <ul className="space-y-1.5">
                    {result.tips.map((t, i) => (
                      <li key={i} className="text-[0.78rem] flex gap-2" style={{ color: "var(--text-2)" }}>
                        <span style={{ color: "var(--gold)" }}>•</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="rounded-xl p-5 text-center"
                style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
                <p className="text-2xl mb-2">👨‍⚖️</p>
                <p className="text-[0.82rem] font-medium mb-1" style={{ color: "var(--text-2)" }}>
                  Find verified advocates near you
                </p>
                <p className="text-[0.72rem]" style={{ color: "var(--text-3)" }}>
                  Enter your location and choose the type of legal help you need
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Free Legal Aid tab ── */}
        {tab === "free" && freeAid && (
          <div className="space-y-4 animate-fade-up">
            {/* NALSA card */}
            <div className="rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg, rgba(201,146,10,0.08), rgba(201,146,10,0.03))",
                       border: "1px solid rgba(201,146,10,0.2)" }}>
              <p className="text-[0.65rem] uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>
                Free Government Legal Aid
              </p>
              <p className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
                {freeAid.name}
              </p>
              <p className="text-[0.78rem] mb-3" style={{ color: "var(--text-2)" }}>{freeAid.desc}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl px-3 py-2.5 text-center"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(201,146,10,0.2)" }}>
                  <p className="text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>NALSA Helpline</p>
                  <p className="text-xl font-mono font-bold" style={{ color: "var(--gold-light)" }}>
                    {freeAid.nalsa_phone}
                  </p>
                </div>
                <div className="rounded-xl px-3 py-2.5 text-center"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(201,146,10,0.2)" }}>
                  <p className="text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Tele-Law</p>
                  <p className="text-xl font-mono font-bold" style={{ color: "var(--gold-light)" }}>
                    {freeAid.tele_law}
                  </p>
                </div>
              </div>
            </div>

            {/* Who is eligible */}
            <div className="rounded-xl p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <p className="text-[0.65rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
                Who is Eligible for Free Legal Aid
              </p>
              <div className="space-y-2">
                {freeAid.eligibility.map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[0.62rem] font-bold"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                      ✓
                    </span>
                    <p className="text-[0.8rem]" style={{ color: "var(--text-2)" }}>{e}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to access */}
            <div className="rounded-xl p-4" style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              <p className="text-[0.65rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
                How to Access Free Legal Aid
              </p>
              <p className="text-[0.82rem]" style={{ color: "var(--text-2)" }}>{freeAid.how}</p>
            </div>

            {/* NALSA website link */}
            <a href={`https://${freeAid.nalsa_website}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl transition-all group"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-[0.82rem] font-medium" style={{ color: "var(--text)" }}>
                  NALSA Official Website
                </p>
                <p className="text-[0.72rem]" style={{ color: "var(--text-3)" }}>
                  {freeAid.nalsa_website}
                </p>
              </div>
              <ExternalLink size={14} style={{ color: "var(--gold-light)" }} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
