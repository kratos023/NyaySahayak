"use client";
// frontend/src/components/FIRPanel.tsx
// Official FIR form (Form 24.1 under Section 154 CrPC / Section 173 BNSS)
// with evidence image upload support

import { useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Download, Upload, Trash2, Loader2, Camera, Info } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
];

const OFFENCE_TYPES = [
  "Physical assault / Hurt (Section 319-322 IPC / Section 115-118 BNS)",
  "Theft / Robbery (Section 378-382 IPC / Section 303-307 BNS)",
  "Cheating / Fraud (Section 420 IPC / Section 316 BNS)",
  "Domestic Violence (Section 498A IPC / DV Act 2005)",
  "Harassment / Stalking (Section 354D IPC / Section 78 BNS)",
  "Sexual Assault (Section 354 IPC / Section 74 BNS)",
  "Dowry Harassment (Section 498A / 304B IPC)",
  "Criminal Intimidation / Threat (Section 503-506 IPC / Section 351 BNS)",
  "Cyber Crime (IT Act 2000 / Section 66, 67)",
  "Kidnapping (Section 359-374 IPC / Section 136-143 BNS)",
  "Murder / Attempt to murder (Section 302-307 IPC / Section 101-109 BNS)",
  "Property Damage (Section 426-440 IPC / Section 324-330 BNS)",
  "Other",
];

const EVIDENCE_TYPES = [
  "Photographs / Videos",
  "Medical Certificate / Doctor's Report",
  "WhatsApp / SMS Messages",
  "Audio Recording",
  "CCTV Footage / Screenshots",
  "Witness Statement",
  "Bank / Transaction Records",
  "Written Threats / Letters",
  "Other Documents",
];

interface Props { onClose: () => void; }

export default function FIRPanel({ onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proofImages, setProofImages] = useState<{ name: string; b64: string; preview: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    // Section 1 — Police station info
    district: "", state: "Delhi", police_station: "",
    // Section 2 — Complainant
    full_name: "", age: "", gender: "Female", occupation: "",
    address: "", city: "", pincode: "", contact: "",
    // Section 3 — Incident
    incident_date: "", incident_time: "", incident_day: "",
    incident_location: "", offence_type: "", sections_applicable: "",
    // Section 4 — Description
    incident_description: "",
    evidence_types: [] as string[],
    accused_name: "", accused_description: "", witnesses: "",
    previous_complaints: "No",
  });

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function toggleEvidence(e: string) {
    setForm(p => ({
      ...p,
      evidence_types: p.evidence_types.includes(e)
        ? p.evidence_types.filter(x => x !== e)
        : [...p.evidence_types, e],
    }));
  }

  async function handleImageFile(file: File) {
    if (proofImages.length >= 6) { alert("Maximum 6 images allowed"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const b64 = result.split(",")[1];
      setProofImages(prev => [...prev, { name: file.name, b64, preview: result }]);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files || []).forEach(handleImageFile);
    e.target.value = "";
  }

  async function handleGenerate() {
    setLoading(true); setError("");
    try {
      const payload = {
        user_data: {
          ...form,
          evidence_types: form.evidence_types.join(", "),
        },
        proof_images: proofImages.map(p => p.b64),
      };
      const res = await fetch(`${API}/api/documents/fir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Generation failed");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `FIR_${form.full_name.replace(/ /g,"_")}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      setStep(4);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  }

  const inputCls = `w-full rounded-xl px-3 py-2.5 text-[0.875rem] border focus:outline-none transition-all`;
  const iStyle = { background: "var(--bg-3)", borderColor: "rgba(255,255,255,0.1)", color: "var(--text)" };
  const labelCls = "text-[0.65rem] uppercase tracking-widest mb-1.5 block";
  const lStyle = { color: "var(--text-3)" };

  const steps = ["Police Station", "Your Details", "Incident + Evidence", "Download"];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div className="flex items-center gap-3">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep(s => (s - 1) as typeof step)}
              className="p-1.5 rounded-xl" style={{ color: "var(--text-3)" }}>
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg" style={{ color: "var(--gold-light)" }}>🚨 FIR Draft</h2>
              <span className="text-[0.62rem] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                Official Format · Form 24.1
              </span>
            </div>
            <p className="text-[0.68rem] mt-0.5" style={{ color: "var(--text-3)" }}>
              Section 154 CrPC / Section 173 BNSS · Step {step} of 4
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--text-3)" }}>
          <X size={16} />
        </button>
      </div>

      {/* Progress */}
      <div className="flex px-5 py-3 gap-1 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold transition-all"
              style={{
                background: step > i + 1 ? "var(--success)" : step === i + 1 ? "var(--gold)" : "var(--bg-4)",
                color: step >= i + 1 ? "#000" : "var(--text-3)",
                border: step === i + 1 ? "none" : "1px solid var(--border)",
              }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <p className="text-[0.58rem] text-center hidden sm:block"
              style={{ color: step === i + 1 ? "var(--gold-light)" : "var(--text-3)" }}>{s}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {error && (
          <div className="p-3 rounded-xl text-[0.8rem]"
            style={{ background: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        {/* Official format note */}
        {step === 1 && (
          <div className="flex gap-2.5 p-3 rounded-xl text-[0.75rem]"
            style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", color: "#93c5fd" }}>
            <Info size={13} className="flex-shrink-0 mt-0.5" />
            This generates an official FIR draft in Form 24.1 format. Print and submit at your local police station. You have the right to a free copy under Section 154(3) CrPC.
          </div>
        )}

        {/* Step 1 — Police station */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Police Station Name *</label>
                <input value={form.police_station} onChange={e => set("police_station", e.target.value)}
                  placeholder="e.g. Connaught Place Police Station" className={inputCls} style={iStyle} />
              </div>
              <div>
                <label className={labelCls} style={lStyle}>District *</label>
                <input value={form.district} onChange={e => set("district", e.target.value)}
                  placeholder="Central Delhi" className={inputCls} style={iStyle} />
              </div>
              <div>
                <label className={labelCls} style={lStyle}>State *</label>
                <select value={form.state} onChange={e => set("state", e.target.value)}
                  className={inputCls} style={iStyle}>
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[0.7rem] p-3 rounded-xl" style={{ background: "var(--bg-3)", color: "var(--text-3)" }}>
              💡 For Zero FIR — you can file at ANY police station. The station name above will appear on the draft. Police will forward it to the correct jurisdiction.
            </p>
          </div>
        )}

        {/* Step 2 — Complainant */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Full Name *</label>
                <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  placeholder="As per Aadhaar / ID proof" className={inputCls} style={iStyle} />
              </div>
              <div>
                <label className={labelCls} style={lStyle}>Age *</label>
                <input value={form.age} onChange={e => set("age", e.target.value)}
                  placeholder="25" type="number" className={inputCls} style={iStyle} />
              </div>
              <div>
                <label className={labelCls} style={lStyle}>Gender *</label>
                <select value={form.gender} onChange={e => set("gender", e.target.value)}
                  className={inputCls} style={iStyle}>
                  <option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Occupation</label>
                <input value={form.occupation} onChange={e => set("occupation", e.target.value)}
                  placeholder="Housewife / Teacher / Engineer etc." className={inputCls} style={iStyle} />
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Full Address *</label>
                <input value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="House No., Street, Area" className={inputCls} style={iStyle} />
              </div>
              <div>
                <label className={labelCls} style={lStyle}>City *</label>
                <input value={form.city} onChange={e => set("city", e.target.value)}
                  placeholder="New Delhi" className={inputCls} style={iStyle} />
              </div>
              <div>
                <label className={labelCls} style={lStyle}>Contact Number *</label>
                <input value={form.contact} onChange={e => set("contact", e.target.value)}
                  placeholder="9876543210" className={inputCls} style={iStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Incident + Evidence */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={lStyle}>Date of Incident *</label>
                <input value={form.incident_date} onChange={e => set("incident_date", e.target.value)}
                  type="date" className={inputCls} style={iStyle} />
              </div>
              <div>
                <label className={labelCls} style={lStyle}>Approximate Time</label>
                <input value={form.incident_time} onChange={e => set("incident_time", e.target.value)}
                  type="time" className={inputCls} style={iStyle} />
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Location of Incident *</label>
                <input value={form.incident_location} onChange={e => set("incident_location", e.target.value)}
                  placeholder="Exact place where the incident occurred" className={inputCls} style={iStyle} />
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Type of Offence *</label>
                <select value={form.offence_type} onChange={e => set("offence_type", e.target.value)}
                  className={inputCls} style={iStyle}>
                  <option value="">— Select offence type —</option>
                  {OFFENCE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Accused Person(s) — if known</label>
                <input value={form.accused_name} onChange={e => set("accused_name", e.target.value)}
                  placeholder="Name, address, description of accused" className={inputCls} style={iStyle} />
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Detailed Description of Incident *</label>
                <textarea value={form.incident_description} onChange={e => set("incident_description", e.target.value)}
                  placeholder="Describe exactly what happened, in chronological order. Include who, what, where, when, and how."
                  rows={5} className={`${inputCls} resize-none`} style={iStyle} />
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={lStyle}>Witnesses (if any)</label>
                <input value={form.witnesses} onChange={e => set("witnesses", e.target.value)}
                  placeholder="Names and contact of witnesses" className={inputCls} style={iStyle} />
              </div>
            </div>

            {/* Evidence types */}
            <div>
              <label className={labelCls} style={lStyle}>Available Evidence</label>
              <div className="grid grid-cols-2 gap-2">
                {EVIDENCE_TYPES.map(e => (
                  <label key={e} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl transition-all"
                    style={{
                      background: form.evidence_types.includes(e) ? "rgba(201,146,10,0.08)" : "var(--bg-3)",
                      border: form.evidence_types.includes(e) ? "1px solid rgba(201,146,10,0.3)" : "1px solid var(--border)",
                    }}>
                    <input type="checkbox" checked={form.evidence_types.includes(e)}
                      onChange={() => toggleEvidence(e)} className="accent-amber-500" />
                    <span className="text-[0.75rem]" style={{ color: "var(--text-2)" }}>{e}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className={labelCls} style={lStyle}>
                Upload Evidence Photos ({proofImages.length}/6)
              </label>
              <p className="text-[0.68rem] mb-2" style={{ color: "var(--text-3)" }}>
                Photos will be embedded in the FIR PDF as evidence exhibits
              </p>

              {/* Upload buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => cameraRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-[0.8rem] transition-all"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  <Camera size={14} /> Take Photo
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-[0.8rem] transition-all"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  <Upload size={14} /> Upload Image
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                multiple className="hidden" onChange={handleFileChange} />
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                multiple className="hidden" onChange={handleFileChange} />

              {/* Preview grid */}
              {proofImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {proofImages.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square"
                      style={{ border: "1px solid var(--border)" }}>
                      <img src={img.preview} alt={img.name}
                        className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100
                        transition-opacity flex items-center justify-center">
                        <button onClick={() => setProofImages(prev => prev.filter((_, j) => j !== i))}
                          className="p-1.5 rounded-full bg-red-600 text-white">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[0.55rem]
                        truncate" style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
                        Exhibit {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
              ✅
            </div>
            <div>
              <p className="text-base font-medium" style={{ color: "var(--text)" }}>FIR Draft Downloaded!</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Next steps:</p>
            </div>
            <div className="text-left w-full space-y-2.5 rounded-2xl p-5"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              {[
                "Print the PDF (black & white is fine)",
                "Sign at the bottom of each page",
                "Visit your nearest police station",
                "Submit to the SHO / duty officer",
                "Insist on getting a stamped acknowledgment",
                "Get the FIR number — you are entitled to a free copy",
                "If refused: go to Superintendent of Police (SP) or file online at your state police website",
              ].map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="font-bold flex-shrink-0" style={{ color: "var(--gold)" }}>{i+1}.</span>
                  <p className="text-[0.82rem]" style={{ color: "var(--text-2)" }}>{s}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => { setStep(1); setForm(f => ({ ...f, incident_description: "" })); setProofImages([]); }}
                className="flex-1 py-3 rounded-xl text-sm transition-all"
                style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                New FIR Draft
              </button>
              <button onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, var(--gold), #b45309)", color: "#000" }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => (s + 1) as typeof step)}
              disabled={
                (step === 1 && (!form.police_station || !form.district)) ||
                (step === 2 && (!form.full_name || !form.address || !form.contact || !form.age))
              }
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40
                flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--gold), #b45309)", color: "#000" }}>
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!form.incident_description || !form.incident_date || !form.offence_type || loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40
                flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "white" }}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Generating Official FIR…</>
                : <><Download size={14} /> Download Official FIR PDF</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
