"use client";
// frontend/src/components/LegalNews.tsx
import { useState, useEffect } from "react";
import { X, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { LANG_CODE } from "./VoiceButton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Article {
  title: string; link: string; summary: string;
  date: string; source: string; source_icon: string;
}

interface Props {
  onClose: () => void;
  language: string;
  onSendToChat: (text: string) => void;
}

const SOURCES = ["all", "Live Law", "Bar & Bench", "Supreme Court Observer"];

export default function LegalNews({ onClose, language, onSendToChat }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [source, setSource]     = useState("all");
  const [error, setError]       = useState("");
  const langCode = LANG_CODE[language] || "en";

  useEffect(() => { loadNews(); }, [source, langCode]);

  async function loadNews(force = false) {
    setLoading(true); setError("");
    try {
      const url = `${API}/api/news/feed?lang=${langCode}&source=${encodeURIComponent(source)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {
      setError("Could not load news. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
    catch { return d.slice(0, 10); }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div>
          <h2 className="font-display text-xl" style={{ color: "var(--gold-light)" }}>
            📰 Legal News
          </h2>
          <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--text-3)" }}>
            Latest from Indian courts & legal developments · {language}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadNews(true)} disabled={loading}
            className="p-2 rounded-xl transition-colors disabled:opacity-50"
            style={{ color: "var(--text-3)" }}
            title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--text-3)" }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 px-5 py-3 border-b overflow-x-auto flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {SOURCES.map(s => (
          <button key={s} onClick={() => setSource(s)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[0.72rem] font-medium transition-all"
            style={source === s
              ? { background: "var(--gold-dim)", color: "var(--gold-light)", border: "1px solid rgba(201,146,10,0.3)" }
              : { background: "var(--bg-3)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
            {s === "all" ? "All Sources" : s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--gold)" }} />
            <p className="text-[0.78rem]" style={{ color: "var(--text-3)" }}>
              {langCode !== "en" ? `Translating to ${language}…` : "Loading news…"}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl px-4 py-3 text-[0.8rem] text-center"
            style={{ background: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-[0.8rem]" style={{ color: "var(--text-3)" }}>No articles found</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="space-y-3">
            {articles.map((art, i) => (
              <div key={i}
                className="group rounded-2xl p-4 transition-all duration-200 animate-fade-up"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)",
                         animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: "forwards" }}>

                {/* Source + date */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--bg-3)", color: "var(--text-3)",
                             border: "1px solid var(--border)" }}>
                    {art.source_icon} {art.source}
                  </span>
                  <span className="text-[0.65rem]" style={{ color: "var(--text-3)" }}>
                    {formatDate(art.date)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-[0.875rem] font-medium leading-snug mb-2 transition-colors"
                  style={{ color: "var(--text)" }}>
                  {art.title}
                </h3>

                {/* Summary */}
                {art.summary && (
                  <p className="text-[0.78rem] leading-relaxed mb-3 line-clamp-3"
                    style={{ color: "var(--text-2)" }}>
                    {art.summary}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {art.link && (
                    <a href={art.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[0.72rem] transition-colors"
                      style={{ color: "var(--gold-light)" }}>
                      Read full article <ExternalLink size={10} />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      onSendToChat(`Tell me more about this legal news: "${art.title}". What does it mean for ordinary citizens?`);
                      onClose();
                    }}
                    className="ml-auto text-[0.7rem] px-2.5 py-1 rounded-lg transition-all"
                    style={{ color: "var(--text-3)", background: "var(--bg-3)",
                             border: "1px solid var(--border)" }}>
                    Ask AI ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
