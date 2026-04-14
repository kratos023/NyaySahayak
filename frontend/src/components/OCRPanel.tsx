"use client";
// frontend/src/components/OCRPanel.tsx
import { useState, useRef } from "react";
import { X, Camera, Upload, Loader2, FileText, Download, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SuggestionChips from "./SuggestionChips";
import type { Suggestions } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LANG_CODE: Record<string, string> = {
  English: "en", Hindi: "hi", Bengali: "bn", Telugu: "te",
  Marathi: "mr", Tamil: "ta", Gujarati: "gu", Kannada: "kn",
  Malayalam: "ml", Punjabi: "pa", Odia: "or",
};

interface Props {
  onClose: () => void;
  language: string;
  userId: string;
  onSendToChat: (text: string) => void;
}

type State = "idle" | "uploading" | "extracting" | "done" | "error";

export default function OCRPanel({ onClose, language, userId, onSendToChat }: Props) {
  const [state, setState]             = useState<State>("idle");
  const [preview, setPreview]         = useState<string | null>(null);
  const [extractedText, setExtracted] = useState("");
  const [analysis, setAnalysis]       = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [error, setError]             = useState("");
  const [copied, setCopied]           = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file) return;
    setState("extracting");
    setError("");
    setExtracted("");
    setAnalysis("");
    setSuggestions(null);

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", LANG_CODE[language] || "en");
      form.append("user_id", userId);

      const res = await fetch(`${API}/api/ocr/extract`, { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);

      setExtracted(data.extracted_text || "");
      setAnalysis(data.analysis || "");
      setSuggestions(data.suggestions || null);
      setState("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Extraction failed");
      setState("error");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  async function copyText() {
    await navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadText() {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "extracted_text.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
        <div>
          <h2 className="font-display text-lg text-[var(--gold-light)]">📷 Scan Document</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Take a photo of any legal document — FIR, notice, land record, letter
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Upload zone */}
        {state === "idle" || state === "error" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {/* Camera capture */}
              <button onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center gap-2.5 p-6 rounded-2xl border-2
                  border-dashed border-white/10 hover:border-[var(--gold)]/40
                  hover:bg-white/[0.02] transition-all group">
                <Camera size={28} className="text-gray-600 group-hover:text-[var(--gold)] transition-colors" />
                <p className="text-sm text-gray-400">Take Photo</p>
                <p className="text-[0.65rem] text-gray-600 text-center">Use your phone camera</p>
              </button>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handleFileChange} />

              {/* File upload */}
              <button onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2.5 p-6 rounded-2xl border-2
                  border-dashed border-white/10 hover:border-[var(--gold)]/40
                  hover:bg-white/[0.02] transition-all group">
                <Upload size={28} className="text-gray-600 group-hover:text-[var(--gold)] transition-colors" />
                <p className="text-sm text-gray-400">Upload Image</p>
                <p className="text-[0.65rem] text-gray-600 text-center">JPG, PNG, WebP</p>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden" onChange={handleFileChange} />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="rounded-xl bg-[var(--bg-3)] border border-white/5 p-4 text-xs
              text-[var(--text-muted)] space-y-1.5">
              <p className="text-gray-300 font-medium">Works best with:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>FIR copies and police documents</li>
                <li>Court summons and notices</li>
                <li>Land records and property documents</li>
                <li>Government letters and orders</li>
                <li>Handwritten or printed documents</li>
              </ul>
              <p className="text-gray-600 mt-2">Hindi, English, and other Indian languages supported</p>
            </div>
          </>
        ) : null}

        {/* Processing state */}
        {state === "extracting" && (
          <div className="space-y-4">
            {preview && (
              <img src={preview} alt="Document" className="w-full rounded-2xl object-contain
                max-h-48 border border-white/5 opacity-60" />
            )}
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={28} className="animate-spin text-[var(--gold)]" />
              <p className="text-sm text-gray-300">Reading your document…</p>
              <p className="text-xs text-[var(--text-muted)]">
                Gemini Vision is extracting text and analyzing the document
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {state === "done" && (
          <div className="space-y-5">
            {/* Thumbnail */}
            {preview && (
              <img src={preview} alt="Document" className="w-full rounded-2xl object-contain
                max-h-36 border border-white/5" />
            )}

            {/* Extracted text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                  Extracted Text
                </p>
                <div className="flex gap-2">
                  <button onClick={copyText}
                    className="text-xs text-gray-500 hover:text-[var(--gold-light)] flex items-center gap-1">
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={downloadText}
                    className="text-xs text-gray-500 hover:text-[var(--gold-light)] flex items-center gap-1">
                    <Download size={11} /> Save
                  </button>
                </div>
              </div>
              <div className="bg-[var(--bg-3)] rounded-xl border border-white/5 p-4
                max-h-36 overflow-y-auto">
                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {extractedText}
                </p>
              </div>
            </div>

            {/* Analysis */}
            {analysis && (
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">
                  AI Analysis
                </p>
                <div className="bg-[var(--bg-3)] rounded-xl border border-white/5 p-4
                  max-h-64 overflow-y-auto prose-legal">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest mb-3">
                  What you can do next
                </p>
                <SuggestionChips
                  suggestions={suggestions}
                  onFollowUp={q => { onSendToChat(q); onClose(); }}
                  onOpenLocation={() => {}}
                  onOpenFIR={() => {}}
                  onOpenReport={() => {}}
                  onOpenDocs={() => {}}
                />
              </div>
            )}

            {/* Scan another */}
            <button
              onClick={() => { setState("idle"); setPreview(null); setExtracted(""); setAnalysis(""); setSuggestions(null); }}
              className="w-full py-2.5 rounded-xl border border-white/10 text-sm text-gray-400
                hover:bg-white/5 transition-colors">
              Scan Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
