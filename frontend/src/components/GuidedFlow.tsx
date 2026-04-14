"use client";
// frontend/src/components/GuidedFlow.tsx
import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Loader2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LANG_CODE } from "./VoiceButton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FlowMeta {
  id: string; icon: string; title: string; desc: string;
  color: string; accent: string; step_count: number;
}
interface Step {
  id: string; question: string; type: "options" | "multi";
  options: string[];
}
interface Flow { id: string; icon: string; title: string; steps: Step[]; color: string; accent: string; }

interface Props {
  onClose: () => void;
  language: string;
  userId: string;
  onSendToChat: (text: string) => void;
}

export default function GuidedFlow({ onClose, language, userId, onSendToChat }: Props) {
  const [flows, setFlows]         = useState<FlowMeta[]>([]);
  const [selected, setSelected]   = useState<Flow | null>(null);
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState<Record<string, string | string[]>>({});
  const [plan, setPlan]           = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingFlows, setLoadingFlows] = useState(true);

  const langCode = LANG_CODE[language] || "en";

  useEffect(() => {
    fetch(`${API}/api/flows/list`)
      .then(r => r.json())
      .then(d => setFlows(d.flows || []))
      .catch(() => {})
      .finally(() => setLoadingFlows(false));
  }, []);

  async function selectFlow(id: string) {
    const res = await fetch(`${API}/api/flows/${id}`);
    const data = await res.json();
    setSelected(data);
    setStep(0);
    setAnswers({});
    setPlan("");
  }

  function handleOption(stepId: string, option: string, isMulti: boolean) {
    if (isMulti) {
      const current = (answers[stepId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      setAnswers(prev => ({ ...prev, [stepId]: updated }));
    } else {
      setAnswers(prev => ({ ...prev, [stepId]: option }));
    }
  }

  function canProceed() {
    if (!selected) return false;
    const current = selected.steps[step];
    const ans = answers[current.id];
    if (current.type === "multi") return Array.isArray(ans) && ans.length > 0;
    return Boolean(ans);
  }

  async function generatePlan() {
    if (!selected) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/flows/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_id: selected.id,
          answers,
          language: langCode,
          user_id: userId,
        }),
      });
      const data = await res.json();
      setPlan(data.plan || "");
    } catch {
      setPlan("⚠️ Could not generate plan. Please call NALSA: 1800-110-370 for free legal help.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Flow list ──────────────────────────────────────────────────────────────
  if (!selected) return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div>
          <h2 className="font-display text-xl" style={{ color: "var(--gold-light)" }}>
            🧭 Guided Legal Help
          </h2>
          <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--text-3)" }}>
            Choose your situation — we'll guide you step by step
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--text-3)" }}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {loadingFlows ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {flows.map((f, i) => (
              <button key={f.id} onClick={() => selectFlow(f.id)}
                className="text-left p-4 rounded-2xl border transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98] animate-fade-up"
                style={{ background: f.color, borderColor: f.accent + "30",
                         animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}>
                <span className="text-2xl block mb-2">{f.icon}</span>
                <p className="text-[0.82rem] font-semibold leading-tight mb-1"
                  style={{ color: "var(--text)" }}>{f.title}</p>
                <p className="text-[0.68rem] leading-relaxed"
                  style={{ color: "var(--text-3)" }}>{f.desc}</p>
                <div className="flex items-center gap-1 mt-2.5 text-[0.65rem]"
                  style={{ color: f.accent }}>
                  {f.step_count} questions <ChevronRight size={10} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const currentStep = selected.steps[step];
  const isLastStep  = step === selected.steps.length - 1;
  const progress    = ((step) / selected.steps.length) * 100;

  // ── Result plan ────────────────────────────────────────────────────────────
  if (plan) return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div>
          <p className="text-[0.65rem] uppercase tracking-widest mb-0.5" style={{ color: "var(--text-3)" }}>
            {selected.icon} {selected.title}
          </p>
          <h2 className="font-display text-xl" style={{ color: "var(--gold-light)" }}>
            Your Action Plan
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--text-3)" }}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="rounded-2xl p-5 prose-legal"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onSendToChat(`I have a ${selected.title} situation. ${plan.slice(0, 300)}... What else should I know?`);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--gold-dim)", color: "var(--gold-light)",
                     border: "1px solid rgba(201,146,10,0.3)" }}>
            Ask AI follow-up questions ↗
          </button>
          <button
            onClick={() => { setSelected(null); setAnswers({}); setPlan(""); setStep(0); }}
            className="flex-1 py-3 rounded-xl text-sm transition-all"
            style={{ background: "var(--bg-3)", color: "var(--text-2)",
                     border: "1px solid var(--border)" }}>
            Try Another Flow
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step wizard ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); setAnswers({}); setStep(0); }}
            className="p-1.5 rounded-xl transition-colors" style={{ color: "var(--text-3)" }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              {selected.icon} {selected.title}
            </p>
            <p className="text-[0.72rem]" style={{ color: "var(--text-2)" }}>
              Question {step + 1} of {selected.steps.length}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--text-3)" }}>
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 flex-shrink-0" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--gold)" }} />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">
        <h3 className="text-lg font-semibold leading-snug" style={{ color: "var(--text)" }}>
          {currentStep.question}
        </h3>

        <div className="space-y-2.5">
          {currentStep.options.map(option => {
            const isMulti = currentStep.type === "multi";
            const ans = answers[currentStep.id];
            const isSelected = isMulti
              ? Array.isArray(ans) && ans.includes(option)
              : ans === option;

            return (
              <button key={option}
                onClick={() => handleOption(currentStep.id, option, isMulti)}
                className="w-full text-left px-4 py-3 rounded-xl transition-all duration-150
                  flex items-center gap-3"
                style={isSelected
                  ? { background: "rgba(201,146,10,0.1)", border: `1px solid ${selected.accent}60`,
                      color: "var(--text)" }
                  : { background: "var(--bg-2)", border: "1px solid var(--border)",
                      color: "var(--text-2)" }}>
                {/* Check indicator */}
                <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border transition-all"
                  style={isSelected
                    ? { background: selected.accent, borderColor: selected.accent }
                    : { borderColor: "var(--border-md)" }}>
                  {isSelected && <Check size={10} color="#000" strokeWidth={3} />}
                </span>
                <span className="text-[0.875rem]">{option}</span>
              </button>
            );
          })}
        </div>

        {currentStep.type === "multi" && (
          <p className="text-[0.7rem]" style={{ color: "var(--text-3)" }}>
            Select all that apply
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="px-5 py-3 rounded-xl text-sm transition-all"
            style={{ background: "var(--bg-3)", color: "var(--text-2)",
                     border: "1px solid var(--border)" }}>
            ← Back
          </button>
        )}
        <button
          onClick={() => isLastStep ? generatePlan() : setStep(s => s + 1)}
          disabled={!canProceed() || generating}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all
            disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: canProceed() && !generating ? "linear-gradient(135deg, var(--gold), #b45309)" : "var(--bg-4)",
                   color: canProceed() && !generating ? "#000" : "var(--text-3)" }}>
          {generating ? (
            <><Loader2 size={15} className="animate-spin" /> Generating your plan…</>
          ) : isLastStep ? (
            "Generate My Action Plan →"
          ) : (
            "Next →"
          )}
        </button>
      </div>
    </div>
  );
}
