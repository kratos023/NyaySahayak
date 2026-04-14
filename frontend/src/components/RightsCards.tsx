"use client";
// frontend/src/components/RightsCards.tsx
import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Phone, BookOpen } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Category {
  id: string; icon: string; title: string;
  color: string; accent: string;
  helpline: [string, string];
}

interface CategoryDetail extends Category {
  rights: string[];
  laws: string[];
}

interface Props {
  onClose: () => void;
  language: string;       // display name e.g. "Hindi"
  onSendToChat: (q: string) => void;
}

const LANG_CODE: Record<string, string> = {
  English: "en", Hindi: "hi", Bengali: "bn", Telugu: "te",
  Marathi: "mr", Tamil: "ta", Gujarati: "gu", Kannada: "kn",
  Malayalam: "ml", Punjabi: "pa", Odia: "or",
};

export default function RightsCards({ onClose, language, onSendToChat }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected]     = useState<CategoryDetail | null>(null);
  const [loading, setLoading]       = useState(false);
  const [cardLoading, setCardLoading] = useState(true);

  const langCode = LANG_CODE[language] || "en";

  useEffect(() => {
    fetch(`${API}/api/rights/categories`)
      .then(r => r.json())
      .then(d => setCategories(d.categories))
      .catch(() => {})
      .finally(() => setCardLoading(false));
  }, []);

  async function openCategory(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/rights/category/${id}?lang=${langCode}`);
      const data = await res.json();
      setSelected(data);
    } catch { }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
        <div>
          <h2 className="font-display text-lg text-[var(--gold-light)]">⚖️ Know Your Rights</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Tap any card to see your rights in {language}
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]">
          <X size={16} />
        </button>
      </div>

      {/* Category grid */}
      {!selected && (
        <div className="flex-1 overflow-y-auto p-5">
          {cardLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => openCategory(cat.id)}
                  className="relative text-left p-4 rounded-2xl border border-white/5
                    hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden group"
                  style={{ background: cat.color }}
                >
                  {/* Accent glow */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 blur-xl transition-opacity group-hover:opacity-40"
                    style={{ background: cat.accent }} />
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <p className="text-sm font-medium text-gray-200 leading-tight">{cat.title}</p>
                  <p className="text-[0.65rem] mt-1.5 font-mono" style={{ color: cat.accent }}>
                    {cat.helpline[1]}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail view */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[var(--text-muted)] animate-pulse">
            Translating to {language}…
          </p>
        </div>
      )}

      {selected && !loading && (
        <div className="flex-1 overflow-y-auto">
          {/* Back + header */}
          <div className="p-5 border-b border-white/5 flex items-center gap-3"
            style={{ background: selected.color }}>
            <button onClick={() => setSelected(null)}
              className="text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-1">
              ← Back
            </button>
            <div className="flex-1">
              <p className="font-display text-base text-white">
                {selected.icon} {selected.title}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Rights list */}
            <div className="space-y-2.5">
              {selected.rights.map((right, i) => (
                <div key={i}
                  className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5
                    hover:border-white/10 transition-colors">
                  <span className="text-sm font-bold flex-shrink-0 mt-0.5"
                    style={{ color: selected.accent }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">{right}</p>
                </div>
              ))}
            </div>

            {/* Laws */}
            <div className="rounded-xl border border-white/5 bg-[var(--bg-3)] p-4">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <BookOpen size={11} /> Relevant Laws
              </p>
              <div className="space-y-1">
                {selected.laws.map((law, i) => (
                  <p key={i} className="text-xs text-gray-400">• {law}</p>
                ))}
              </div>
            </div>

            {/* Helpline */}
            <div className="rounded-xl p-4 border"
              style={{ borderColor: selected.accent + "40", background: selected.color }}>
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                <Phone size={11} /> Helpline
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-200">{selected.helpline[0]}</p>
                <p className="text-xl font-mono font-bold" style={{ color: selected.accent }}>
                  {selected.helpline[1]}
                </p>
              </div>
            </div>

            {/* Ask AI */}
            <button
              onClick={() => {
                onSendToChat(`Tell me more about my rights related to: ${selected.title}`);
                onClose();
              }}
              className="w-full py-3 rounded-xl border text-sm font-medium transition-all
                hover:opacity-90 active:scale-[0.98]"
              style={{ borderColor: selected.accent + "60", color: selected.accent,
                       background: selected.color }}>
              Ask AI more about these rights ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
