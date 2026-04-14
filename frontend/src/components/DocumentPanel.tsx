"use client";
// frontend/src/components/DocumentPanel.tsx
import { useState, useRef } from "react";
import { Upload, X, FileText, Download } from "lucide-react";
import { analyzeDocument } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SuggestionChips from "./SuggestionChips";
import type { Suggestions } from "@/lib/api";

const LANGUAGES = [
  { label: "English", code: "en" }, { label: "Hindi", code: "hi" },
  { label: "Tamil", code: "ta" },   { label: "Telugu", code: "te" },
  { label: "Bengali", code: "bn" }, { label: "Marathi", code: "mr" },
  { label: "Gujarati", code: "gu" }, { label: "Kannada", code: "kn" },
];

interface Props {
  onClose: () => void;
  onOpenLocation: () => void;
  onOpenFIR: () => void;
  onOpenReport: () => void;
  onSendToChat: (text: string) => void;
  userId: string;
}

export default function DocumentPanel({ onClose, onOpenLocation, onOpenFIR, onOpenReport, onSendToChat, userId }: Props) {
  const [file, setFile]               = useState<File | null>(null);
  const [lang, setLang]               = useState("en");
  const [analysis, setAnalysis]       = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true); setError(""); setAnalysis(""); setSuggestions(null);
    try {
      const res = await analyzeDocument(file, lang, userId);
      setAnalysis(res.analysis);
      if (res.suggestions) setSuggestions(res.suggestions);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([analysis], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_${file?.name ?? "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h2 className="font-display text-lg text-[var(--gold-light)]">🔍 Document Analysis</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Upload any legal document for AI-powered analysis</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Upload zone */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center
            cursor-pointer hover:border-[var(--gold)]/40 hover:bg-white/[0.02] transition-all group"
        >
          <input ref={inputRef} type="file" className="hidden"
            accept=".pdf,.txt,.docx"
            onChange={e => { setFile(e.target.files?.[0] ?? null); setAnalysis(""); setSuggestions(null); }} />
          {file ? (
            <div className="space-y-1">
              <FileText size={28} className="mx-auto text-[var(--gold-light)]" />
              <p className="text-sm text-gray-200 font-medium">{file.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB · click to change</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={28} className="mx-auto text-gray-600 group-hover:text-[var(--gold)] transition-colors" />
              <p className="text-sm text-gray-400">Drop a file or click to upload</p>
              <p className="text-xs text-gray-600">PDF, TXT, DOCX supported</p>
            </div>
          )}
        </div>

        {/* Language */}
        <div>
          <label className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest mb-1.5 block">
            Analysis Language
          </label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="w-full bg-[var(--bg-3)] border border-white/10 rounded-xl px-3 py-2.5
              text-sm text-gray-200 focus:outline-none focus:border-[var(--gold)]/50">
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        {/* Analyze button */}
        <button onClick={handleAnalyze} disabled={!file || loading}
          className="w-full py-3 rounded-xl bg-[var(--gold)] text-black font-semibold text-sm
            hover:bg-[var(--gold-light)] disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center gap-2">
          {loading
            ? <><span className="animate-spin">⏳</span> Analyzing…</>
            : "Analyze Document"}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-4">
            {/* Download bar */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Analysis Results</p>
              <button onClick={handleDownload}
                className="text-xs text-[var(--gold-light)] hover:text-[var(--gold)] flex items-center gap-1">
                <Download size={11} /> Download
              </button>
            </div>

            {/* Analysis content */}
            <div className="bg-[var(--bg-3)] rounded-xl border border-white/5 p-4 prose-legal
              max-h-[50vh] overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
            </div>

            {/* Suggestion chips */}
            {suggestions && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest mb-3">
                  Based on this document
                </p>
                <SuggestionChips
                  suggestions={suggestions}
                  onFollowUp={q => {
                    // Prepend document context so Gemini knows what document is being discussed
                    const context = `I have a legal document: "${file?.name ?? "document"}". Here is a summary of its analysis:\n\n${analysis.slice(0, 800)}\n\nBased on this document, ${q}`;
                    onSendToChat(context);
                    onClose();
                  }}
                  onOpenLocation={onOpenLocation}
                  onOpenFIR={onOpenFIR}
                  onOpenReport={onOpenReport}
                  onOpenDocs={() => {}}  // already here
                />
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!analysis && !loading && (
          <div className="rounded-xl bg-[var(--bg-3)] border border-white/5 p-4
            text-xs text-[var(--text-muted)] space-y-1.5">
            <p className="text-gray-300 font-medium">Supported documents:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Legal contracts and agreements</li>
              <li>Court documents and petitions</li>
              <li>Police FIRs and complaints</li>
              <li>Property documents</li>
              <li>Any legal text (up to 15,000 chars)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
