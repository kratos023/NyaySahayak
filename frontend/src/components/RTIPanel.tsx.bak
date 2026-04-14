"use client";
// frontend/src/components/RTIPanel.tsx
import { useState } from "react";
import { X, Download, FileText, Loader2, Info } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const COMMON_DEPARTMENTS = [
  "Municipal Corporation / Nagar Palika",
  "District Collectorate",
  "Police Department",
  "Public Works Department (PWD)",
  "Revenue Department",
  "Education Department",
  "Health Department",
  "Central Board of Secondary Education (CBSE)",
  "Income Tax Department",
  "Employees' Provident Fund Organisation (EPFO)",
  "Other (type below)",
];

interface Props { onClose: () => void; }

export default function RTIPanel({ onClose }: Props) {
  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [customDept, setCustomDept] = useState(false);

  const [form, setForm] = useState({
    applicant_name: "", address: "", city: "", state: "Delhi",
    pincode: "", phone: "", email: "",
    department: "", information_sought: "",
    preferred_format: "Certified copies of documents",
    bpl_card: false,
  });

  function set(k: string, v: string | boolean) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleGenerate() {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/api/documents/rti`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Generation failed");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `RTI_${form.applicant_name.replace(/ /g,"_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = `w-full bg-[var(--bg-3)] border border-white/10 rounded-xl px-3 py-2.5
    text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[var(--gold)]/50`;

  const labelCls = "text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest mb-1.5 block";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
        <div>
          <h2 className="font-display text-lg text-[var(--gold-light)]">📋 RTI Application</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Generate a ready-to-post RTI under the RTI Act, 2005
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]">
          <X size={16} />
        </button>
      </div>

      {/* Steps */}
      <div className="flex border-b border-white/5 flex-shrink-0">
        {[
          { n: 1, label: "Your Details" },
          { n: 2, label: "Information Sought" },
          { n: 3, label: "Download" },
        ].map(({ n, label }) => (
          <div key={n} className={`flex-1 py-2.5 text-center text-xs transition-colors
            ${step === n ? "text-[var(--gold-light)] border-b-2 border-[var(--gold)]"
                         : step > n ? "text-green-400" : "text-[var(--text-muted)]"}`}>
            {step > n ? "✓ " : ""}{label}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {/* Step 1 — Personal details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs text-blue-300 flex gap-2">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              Fill your personal details. These will appear on the RTI application.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input value={form.applicant_name} onChange={e => set("applicant_name", e.target.value)}
                  placeholder="Ramesh Kumar" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address *</label>
                <input value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="House No., Street, Area" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City *</label>
                <input value={form.city} onChange={e => set("city", e.target.value)}
                  placeholder="New Delhi" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Pincode *</label>
                <input value={form.pincode} onChange={e => set("pincode", e.target.value)}
                  placeholder="110001" maxLength={6} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State *</label>
                <select value={form.state} onChange={e => set("state", e.target.value)} className={inputCls}>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="9876543210" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Email (optional)</label>
                <input value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com" type="email" className={inputCls} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="bpl" checked={form.bpl_card}
                  onChange={e => set("bpl_card", e.target.checked)}
                  className="w-4 h-4 accent-yellow-500" />
                <label htmlFor="bpl" className="text-sm text-gray-300 cursor-pointer">
                  I have a BPL card (exempt from ₹10 fee)
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.applicant_name || !form.address || !form.city || !form.phone || !form.pincode}
              className="w-full py-3 rounded-xl bg-[var(--gold)] text-black font-semibold text-sm
                hover:bg-[var(--gold-light)] disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        )}

        {/* Step 2 — Information sought */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Department / Authority *</label>
              <select
                value={customDept ? "Other (type below)" : form.department}
                onChange={e => {
                  if (e.target.value === "Other (type below)") {
                    setCustomDept(true); set("department", "");
                  } else {
                    setCustomDept(false); set("department", e.target.value);
                  }
                }}
                className={inputCls}>
                <option value="">— Select department —</option>
                {COMMON_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {customDept && (
                <input value={form.department} onChange={e => set("department", e.target.value)}
                  placeholder="Enter department name" className={`${inputCls} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelCls}>Information Sought *</label>
              <p className="text-[0.7rem] text-[var(--text-muted)] mb-1.5">
                Be specific. Ask for documents, dates, names, or status of work.
              </p>
              <textarea
                value={form.information_sought}
                onChange={e => set("information_sought", e.target.value)}
                placeholder="e.g. Please provide certified copies of the approved building plan for plot no. XYZ, along with the names of officers who approved it and the date of approval."
                rows={5}
                className={`${inputCls} resize-none`}
              />
              <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">
                {form.information_sought.length} chars
              </p>
            </div>

            <div>
              <label className={labelCls}>Preferred Format</label>
              <select value={form.preferred_format} onChange={e => set("preferred_format", e.target.value)}
                className={inputCls}>
                <option>Certified copies of documents</option>
                <option>Inspection of documents</option>
                <option>Printout of electronic records</option>
                <option>Certified samples of material</option>
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-gray-400
                  hover:bg-white/5 transition-colors">
                ← Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={!form.department || !form.information_sought || loading}
                className="flex-1 py-3 rounded-xl bg-[var(--gold)] text-black font-semibold text-sm
                  hover:bg-[var(--gold-light)] disabled:opacity-40 transition-colors
                  flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : <><FileText size={14} /> Generate PDF</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700/40
              flex items-center justify-center text-3xl">
              ✅
            </div>
            <div>
              <p className="text-base font-medium text-gray-200">RTI Application Generated!</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Your PDF has been downloaded. Here's what to do next:
              </p>
            </div>
            <div className="text-left bg-[var(--bg-3)] border border-white/5 rounded-2xl p-5
              space-y-2.5 text-sm w-full">
              {[
                "Print the PDF application",
                "Attach ₹10 fee (postal order/court fee stamp) — or your BPL card",
                "Send by Speed Post to the PIO of the department",
                "Keep a copy with the Speed Post receipt",
                "If no reply in 30 days → file First Appeal to same department",
              ].map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="text-[var(--gold)] font-bold flex-shrink-0">{i+1}.</span>
                  <p className="text-gray-300">{s}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => { setStep(1); setForm({
                applicant_name:"",address:"",city:"",state:"Delhi",pincode:"",phone:"",email:"",
                department:"",information_sought:"",preferred_format:"Certified copies of documents",bpl_card:false
              }); }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-gray-400
                  hover:bg-white/5 transition-colors">
                File Another RTI
              </button>
              <button onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-[var(--gold)] text-black font-semibold text-sm
                  hover:bg-[var(--gold-light)] transition-colors">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
