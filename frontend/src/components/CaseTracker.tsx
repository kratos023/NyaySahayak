"use client";
// frontend/src/components/CaseTracker.tsx
// Simple direct links — eCourts has CAPTCHA so we just link out
import { X, ExternalLink } from "lucide-react";

interface Props { onClose: () => void; }

const COURTS = [
  { label: "🏛️ eCourts — All District Courts",       url: "https://services.ecourts.gov.in/ecourtindia_v6/",  desc: "Search by CNR, party name, case no., FIR no., advocate", primary: true },
  { label: "📱 eCourts Mobile App (Android)",          url: "https://play.google.com/store/apps/details?id=com.nic.ecourts", desc: "Fastest — enter CNR number for instant case status" },
  { label: "📱 eCourts Mobile App (iOS)",              url: "https://apps.apple.com/in/app/ecourts-services/id1329001616", desc: "Same as Android — works offline for saved cases" },
  { label: "⚖️ Supreme Court of India",               url: "https://main.sci.gov.in/case-status",             desc: "Track SCI cases, cause lists, judgments" },
  { label: "🏛️ Delhi High Court",                    url: "https://delhihighcourt.nic.in/",                  desc: "Case status, orders, cause list" },
  { label: "🏛️ Bombay High Court",                   url: "https://bombayhighcourt.nic.in/",                 desc: "Case status, e-filing, orders" },
  { label: "🏛️ Madras High Court",                   url: "https://hcmadras.tn.nic.in/",                    desc: "Case status, cause list" },
  { label: "🏛️ Calcutta High Court",                 url: "https://calcuttahighcourt.gov.in/",               desc: "Case status, orders" },
  { label: "🏛️ Karnataka High Court",                url: "https://hck.kar.nic.in/",                        desc: "Case status, e-filing" },
  { label: "🏛️ Allahabad High Court",                url: "https://allahabadhighcourt.in/",                  desc: "Case status, cause list" },
  { label: "🏛️ Gujarat High Court",                  url: "https://gujarathighcourt.nic.in/",                desc: "Case status, orders" },
  { label: "🏛️ Kerala High Court",                   url: "https://highcourt.kerala.gov.in/",                desc: "Case status, orders" },
  { label: "🏛️ Punjab & Haryana High Court",         url: "https://highcourtchd.gov.in/",                   desc: "Case status, orders" },
  { label: "🏛️ Telangana High Court",                url: "https://hct.gov.in/",                            desc: "Case status, orders" },
  { label: "📋 National Judicial Data Grid (NJDG)",   url: "https://njdg.ecourts.gov.in/",                   desc: "Pan-India case statistics and pendency data" },
];

const CNR_TIPS = [
  "CNR (Case Number Record) is the 16-digit unique ID on every court document",
  "Format example: DLCT010012342024 (State + Court + Case + Year)",
  "Find it on: court order copies, cause list, filing receipt, vakalatnama",
  "Fastest search — just enter CNR on eCourts and get instant status",
];

export default function CaseTracker({ onClose }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div>
          <h2 className="font-display text-xl" style={{ color: "var(--gold-light)" }}>🔎 Case Status Tracker</h2>
          <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--text-3)" }}>
            Track any Indian court case — tap to open official portal
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--text-3)" }}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* CNR tip box */}
        <div className="rounded-2xl p-4 space-y-2"
          style={{ background: "rgba(201,146,10,0.06)", border: "1px solid rgba(201,146,10,0.25)" }}>
          <p className="text-[0.72rem] font-semibold" style={{ color: "var(--gold-light)" }}>
            💡 Quickest way — use your CNR number
          </p>
          {CNR_TIPS.map((t, i) => (
            <p key={i} className="text-[0.72rem] flex gap-2" style={{ color: "var(--text-2)" }}>
              <span style={{ color: "var(--gold)", flexShrink: 0 }}>•</span>{t}
            </p>
          ))}
        </div>

        {/* Court links */}
        <div className="space-y-2.5">
          {COURTS.map((c, i) => (
            <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 p-4 rounded-2xl transition-all
                hover:scale-[1.01] active:scale-[0.99] group animate-fade-up"
              style={{
                background: c.primary ? "rgba(201,146,10,0.07)" : "var(--bg-2)",
                border: c.primary ? "1px solid rgba(201,146,10,0.3)" : "1px solid var(--border)",
                animationDelay: `${i * 0.03}s`, opacity: 0, animationFillMode: "forwards",
              }}>
              <div className="min-w-0">
                <p className="text-[0.85rem] font-medium"
                  style={{ color: c.primary ? "var(--gold-light)" : "var(--text)" }}>
                  {c.label}
                </p>
                <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--text-3)" }}>{c.desc}</p>
              </div>
              <ExternalLink size={13} className="flex-shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ color: c.primary ? "var(--gold)" : "var(--text-3)" }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
