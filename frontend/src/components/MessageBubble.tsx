"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Scale } from "lucide-react";
import TTSButton from "./TTSButton";
import type { Message } from "@/lib/api";

interface Props { message: Message; outputLanguage?: string; }

export default function MessageBubble({ message, outputLanguage = "English" }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs
        ${isUser
          ? "bg-gradient-to-br from-blue-600 to-blue-900 text-blue-100"
          : "bg-gradient-to-br from-amber-600 to-amber-900 text-amber-100"
        }`}
        style={{ border: `1px solid ${isUser ? "rgba(59,130,246,0.3)" : "rgba(201,146,10,0.3)"}` }}>
        {isUser ? <User size={13} /> : <Scale size={13} />}
      </div>

      {/* Bubble */}
      <div className={`group relative max-w-[76%] rounded-2xl px-4 py-3 ${
        isUser
          ? "rounded-tr-sm"
          : "rounded-tl-sm"
        }`}
        style={isUser
          ? { background: "linear-gradient(135deg, #0f2756 0%, #0d1f4a 100%)",
              border: "1px solid rgba(59,130,246,0.2)" }
          : { background: "var(--bg-3)",
              border: "1px solid rgba(255,255,255,0.06)" }
        }>

        {isUser ? (
          <p className="text-[0.875rem] text-[var(--text)] whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="prose-legal">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center gap-2 mt-2 ${isUser ? "justify-end" : "justify-between"}`}>
          {message.language && (
            <span className="text-[0.62rem]" style={{ color: "var(--text-3)" }}>
              {message.language}
            </span>
          )}
          {!isUser && <TTSButton text={message.content} language={outputLanguage} />}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 text-amber-100
        flex items-center justify-center flex-shrink-0"
        style={{ border: "1px solid rgba(201,146,10,0.3)" }}>
        <Scale size={13} />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-5 py-3.5"
        style={{ background: "var(--bg-3)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5 h-4">
          <span className="w-1.5 h-1.5 rounded-full dot-1" style={{ background: "var(--gold)" }} />
          <span className="w-1.5 h-1.5 rounded-full dot-2" style={{ background: "var(--gold)" }} />
          <span className="w-1.5 h-1.5 rounded-full dot-3" style={{ background: "var(--gold)" }} />
        </div>
      </div>
    </div>
  );
}
