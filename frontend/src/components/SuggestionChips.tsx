"use client";
// frontend/src/components/SuggestionChips.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp, Phone, Scale, FileText, MapPin, HelpCircle } from "lucide-react";
import type { Suggestions } from "@/lib/api";

interface Props {
  suggestions: Suggestions;
  onFollowUp: (q: string) => void;
  onOpenLocation: () => void;
  onOpenFIR: () => void;
  onOpenReport: () => void;
  onOpenDocs: () => void;
}

export default function SuggestionChips({
  suggestions, onFollowUp, onOpenLocation, onOpenFIR, onOpenReport, onOpenDocs
}: Props) {
  const [casesOpen, setCasesOpen] = useState(false);
  const [helplinesOpen, setHelplinesOpen] = useState(false);

  return (
    <div className="mt-3 space-y-3 animate-fade-up">

      {/* Follow-up questions */}
      {suggestions.followups?.length > 0 && (
        <div>
          <p className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <HelpCircle size={10} /> You might also ask
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.followups.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className="text-[0.8rem] px-3 py-1.5 rounded-full border border-blue-700/50
                  bg-blue-950/40 text-blue-300 hover:border-blue-500 hover:bg-blue-900/50
                  transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Landmark cases */}
      {suggestions.cases?.length > 0 && (
        <div className="border border-white/5 rounded-xl overflow-hidden">
          <button
            onClick={() => setCasesOpen(!casesOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[0.82rem]
              text-[var(--gold-light)] bg-[var(--bg-3)] hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Scale size={13} /> Related landmark cases
            </span>
            {casesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {casesOpen && (
            <div className="divide-y divide-white/5">
              {suggestions.cases.map((c, i) => {
                const [name, desc] = c.split(" — ");
                return (
                  <div key={i} className="flex items-start justify-between gap-3 px-4 py-2.5 bg-[var(--bg-2)]">
                    <div>
                      <p className="text-[0.82rem] font-medium text-gray-200">{name}</p>
                      {desc && <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">{desc}</p>}
                    </div>
                    <button
                      onClick={() => onFollowUp(`Tell me more about ${name} and how it applies to my situation`)}
                      className="flex-shrink-0 text-[0.72rem] px-2.5 py-1 rounded-lg border border-[var(--gold)]/30
                        text-[var(--gold-light)] hover:bg-[var(--gold)]/10 transition-colors whitespace-nowrap"
                    >
                      Ask AI ↗
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Helplines */}
      {suggestions.helplines?.length > 0 && (
        <div className="border border-white/5 rounded-xl overflow-hidden">
          <button
            onClick={() => setHelplinesOpen(!helplinesOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[0.82rem]
              text-green-400 bg-[var(--bg-3)] hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Phone size={13} /> Relevant helplines
            </span>
            {helplinesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {helplinesOpen && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--bg-2)]">
              {suggestions.helplines.map(([name, number], i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[0.78rem] text-gray-300">{name}</span>
                  <span className="text-[0.85rem] font-mono font-semibold text-green-400">{number}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        {suggestions.show_fir && (
          <button onClick={onOpenFIR}
            className="text-[0.78rem] px-3 py-1.5 rounded-lg bg-red-950/50 border border-red-700/40
              text-red-300 hover:bg-red-900/50 hover:border-red-500 transition-all flex items-center gap-1.5">
            <FileText size={11} /> Generate FIR Draft
          </button>
        )}
        {suggestions.show_report && (
          <button onClick={onOpenReport}
            className="text-[0.78rem] px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-700/40
              text-purple-300 hover:bg-purple-900/50 transition-all flex items-center gap-1.5">
            <FileText size={11} /> Full Legal Report
          </button>
        )}
        <button onClick={onOpenLocation}
          className="text-[0.78rem] px-3 py-1.5 rounded-lg bg-teal-950/50 border border-teal-700/40
            text-teal-300 hover:bg-teal-900/50 transition-all flex items-center gap-1.5">
          <MapPin size={11} /> Find Nearest Help
        </button>
        <button onClick={onOpenDocs}
          className="text-[0.78rem] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10
            text-gray-400 hover:bg-white/10 transition-all flex items-center gap-1.5">
          <FileText size={11} /> Analyze a Document
        </button>
      </div>
    </div>
  );
}
