"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Upload, ArrowRight } from "lucide-react";
import MessageBubble, { TypingIndicator } from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import VoiceButton from "./VoiceButton";
import { sendMessage, transcribeAudio } from "@/lib/api";
import { LANG_CODE } from "./VoiceButton";
import type { Message, Suggestions } from "@/lib/api";

const QUICK_TOPICS = [
  { icon: "👨‍👩‍👧", label: "Family Law",      q: "What are the grounds for divorce in India?" },
  { icon: "🏪",      label: "Consumer Rights", q: "How can I file a consumer complaint?" },
  { icon: "🏠",      label: "Property Law",    q: "What documents are needed for property registration?" },
  { icon: "⚖️",     label: "Criminal Law",    q: "What are my rights if I am arrested by police?" },
];

interface Props {
  userId: string; messages: Message[];
  inputLang: string; outputLang: string; enableTTS: boolean;
  pendingMessage?: string | null;
  onPendingMessageConsumed?: () => void;
  onMessagesChange: (msgs: Message[]) => void;
  onOpenLocation: () => void; onOpenFIR: () => void;
  onOpenReport: () => void;   onOpenDocs: () => void;
}

export default function ChatWindow({
  userId, messages, inputLang, outputLang, enableTTS,
  pendingMessage, onPendingMessageConsumed,
  onMessagesChange, onOpenLocation, onOpenFIR, onOpenReport, onOpenDocs
}: Props) {
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const audioUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingMessage && !loading) {
      submit(pendingMessage);
      onPendingMessageConsumed?.();
    }
  }, [pendingMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
  }, [input]);

  async function submit(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text, language: inputLang };
    const updated = [...messages, userMsg];
    onMessagesChange(updated);
    setInput(""); setSuggestions(null); setLoading(true);

    try {
      const res = await sendMessage({ user_id: userId, message: text,
        input_language: inputLang, output_language: outputLang, enable_tts: enableTTS });
      const aiMsg: Message = { role: "assistant",
        content: res.reply_translated || res.reply, language: outputLang };
      onMessagesChange([...updated, aiMsg]);
      if (res.suggestions) setSuggestions(res.suggestions);
      if (enableTTS && res.audio_base64) {
        new Audio(`data:audio/wav;base64,${res.audio_base64}`).play().catch(() => {});
      }
    } catch {
      onMessagesChange([...updated, {
        role: "assistant",
        content: "⚠️ Could not reach the server. Please ensure the backend is running.",
      }]);
    } finally { setLoading(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
  }

  function handleTranscribed(text: string) {
    setInput(prev => prev ? `${prev} ${text}` : text);
    textareaRef.current?.focus();
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await transcribeAudio(file, LANG_CODE[inputLang] || "hi");
      if (res.text) handleTranscribed(res.text);
    } catch { alert("Could not transcribe. Please try again."); }
    e.target.value = "";
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>

      {/* ── Header bar ── */}
      <div className="flex-shrink-0 px-6 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.04)",
                 background: "linear-gradient(180deg, rgba(13,17,32,0.95) 0%, transparent 100%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[0.75rem] text-[var(--text-3)] uppercase tracking-widest">
            Legal AI · {outputLang}
          </p>
        </div>
        <p className="text-[0.7rem] text-[var(--text-3)]">
          {messages.length > 0 ? `${Math.ceil(messages.length / 2)} exchange${messages.length > 2 ? "s" : ""}` : "New conversation"}
        </p>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">

        {/* Empty state */}
        {isEmpty && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-10 animate-fade-in">
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.68rem]
                text-[var(--gold-light)] border border-[var(--gold)]/20 mb-2"
                style={{ background: "rgba(201,146,10,0.06)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI Legal Assistant · India
              </div>
              <h1 className="font-display text-4xl text-gold-gradient leading-tight">
                Nyay-Sahayak
              </h1>
              <p className="text-[0.85rem] text-[var(--text-3)] max-w-xs mx-auto leading-relaxed">
                Ask any legal question in your language — Hindi, Tamil, Telugu and 8 more.
              </p>
            </div>

            {/* Quick topic cards */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-md stagger">
              {QUICK_TOPICS.map(({ icon, label, q }) => (
                <button key={label} onClick={() => submit(q)}
                  className="group text-left px-4 py-3.5 rounded-2xl border transition-all duration-200
                    hover:border-[var(--gold)]/30 active:scale-[0.98]"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <span className="text-xl block mb-2">{icon}</span>
                  <p className="text-[0.78rem] font-medium text-[var(--text-2)] group-hover:text-[var(--text)] transition-colors">{label}</p>
                  <p className="text-[0.68rem] text-[var(--text-3)] mt-1 line-clamp-2 leading-relaxed">{q}</p>
                  <div className="flex items-center gap-1 mt-2 text-[0.62rem] text-[var(--text-3)]
                    group-hover:text-[var(--gold-light)] transition-colors">
                    Ask this <ArrowRight size={9} />
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[0.68rem] text-[var(--text-3)] flex items-center gap-1.5">
              🎤 Click the mic to speak in {inputLang}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.2)}s` }}>
            <MessageBubble message={msg} outputLanguage={outputLang} />
            {msg.role === "assistant" && i === messages.length - 1 && suggestions && (
              <div className="ml-11 mt-3">
                <SuggestionChips
                  suggestions={suggestions}
                  onFollowUp={q => submit(q)}
                  onOpenLocation={onOpenLocation}
                  onOpenFIR={onOpenFIR}
                  onOpenReport={onOpenReport}
                  onOpenDocs={onOpenDocs}
                />
              </div>
            )}
          </div>
        ))}

        {loading && <div className="animate-fade-up"><TypingIndicator /></div>}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 px-4 md:px-8 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)",
                 background: "linear-gradient(0deg, var(--bg-2) 0%, transparent 100%)" }}>
        <div className="flex items-end gap-2 rounded-2xl px-4 py-3 border input-glow transition-all duration-300"
          style={{ background: "var(--bg-3)", borderColor: "rgba(255,255,255,0.08)" }}>
          <textarea ref={textareaRef} rows={1} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask your legal question in ${inputLang}…`}
            className="flex-1 bg-transparent text-[0.875rem] text-[var(--text)] placeholder:text-[var(--text-3)]
              resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: "22px" }}
          />
          <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
            <VoiceButton language={inputLang} onTranscribed={handleTranscribed} disabled={loading} />
            <input ref={audioUploadRef} type="file" className="hidden"
              accept=".wav,.mp3,.m4a,.ogg,.webm" onChange={handleAudioUpload} />
            <button onClick={() => audioUploadRef.current?.click()} disabled={loading}
              className="p-1.5 rounded-xl text-[var(--text-3)] hover:text-[var(--text-2)]
                hover:bg-white/8 transition-all disabled:opacity-40"
              title="Upload audio">
              <Upload size={14} />
            </button>
            <button onClick={() => submit(input)}
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: input.trim() && !loading ? "var(--gold)" : "var(--bg-4)",
                       color: input.trim() && !loading ? "#000" : "var(--text-3)" }}>
              <Send size={14} />
            </button>
          </div>
        </div>
        <p className="text-[0.62rem] text-[var(--text-3)] text-center mt-2">
          General legal information only — consult a qualified lawyer for specific advice
        </p>
      </div>
    </div>
  );
}
