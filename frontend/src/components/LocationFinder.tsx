"use client";
// frontend/src/components/LocationFinder.tsx
import { useState } from "react";
import { Search, MapPin, Phone, X, ExternalLink } from "lucide-react";
import { searchLocations, getCommission, getStates } from "@/lib/api";
import type { LocationResult } from "@/lib/api";

interface Props { onClose: () => void; }

export default function LocationFinder({ onClose }: Props) {
  const [query, setQuery]       = useState("");
  const [result, setResult]     = useState<LocationResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [state, setState]       = useState("");
  const [commission, setCommission] = useState<{ name: string; phone: string; website: string } | null>(null);
  const [states] = useState([
    "Delhi","Maharashtra","Karnataka","Tamil Nadu","Uttar Pradesh",
    "West Bengal","Gujarat","Rajasthan","Telangana","Kerala"
  ]);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await searchLocations(query.trim());
      setResult(data);
    } catch {
      setError("Could not fetch locations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStateSelect(s: string) {
    setState(s);
    if (!s) return;
    try {
      const data = await getCommission(s);
      setCommission(data);
    } catch { setCommission(null); }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h2 className="font-display text-lg text-[var(--gold-light)]">📍 Find Nearest Help</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Police stations, courts, shelters & legal aid near you</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Search */}
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Your Location</label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Connaught Place, New Delhi"
              className="flex-1 bg-[var(--bg-3)] border border-white/10 rounded-xl px-4 py-2.5
                text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[var(--gold)]/50"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2.5 bg-[var(--gold)] text-black rounded-xl text-sm font-semibold
                hover:bg-[var(--gold-light)] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? <span className="animate-spin">⏳</span> : <Search size={14} />}
              Find
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          <a
            href="https://www.google.com/maps/search/police+station+near+me"
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1"
          >
            <MapPin size={10} /> Or use current location in Google Maps ↗
          </a>
        </div>

        {/* Results */}
        {result && (
          <>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">
                Results near <span className="text-[var(--gold-light)]">{result.location}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {result.places.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="group flex flex-col gap-1 p-3 rounded-xl border border-white/5
                      bg-[var(--bg-3)] hover:border-[var(--gold)]/30 hover:bg-white/5 transition-all">
                    <span className="text-sm font-medium text-gray-200 group-hover:text-[var(--gold-light)] transition-colors flex items-center gap-1.5">
                      {p.label} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                    </span>
                    <span className="text-[0.7rem] text-[var(--text-muted)]">{p.desc}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Helplines */}
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">Emergency Helplines</p>
              <div className="grid grid-cols-2 gap-2">
                {result.helplines.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: `${h.color}18`, border: `1px solid ${h.color}30` }}>
                    <span className="text-[0.78rem] text-gray-300">{h.name}</span>
                    <span className="text-[0.9rem] font-mono font-bold text-green-400">{h.number}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* State commission */}
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">State Women's Commission</p>
          <select
            value={state}
            onChange={e => handleStateSelect(e.target.value)}
            className="w-full bg-[var(--bg-3)] border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-gray-200 focus:outline-none focus:border-[var(--gold)]/50"
          >
            <option value="">— Select your state —</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {commission && (
            <div className="mt-3 p-4 rounded-xl border border-purple-700/30 bg-purple-950/20">
              <p className="text-sm font-medium text-purple-300">{commission.name}</p>
              <p className="text-lg font-mono font-bold text-green-400 mt-1">📞 {commission.phone}</p>
              {commission.website && (
                <a href={commission.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1">
                  <ExternalLink size={10} /> {commission.website}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Empty state hint */}
        {!result && !loading && (
          <div className="rounded-xl border border-white/5 bg-[var(--bg-3)] p-5 text-sm text-[var(--text-muted)] space-y-2">
            <p className="font-medium text-gray-300">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Type your city or area above</li>
              <li>Click <strong className="text-[var(--gold-light)]">Find</strong> to get Google Maps links</li>
              <li>Each link opens the nearest relevant authority</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
