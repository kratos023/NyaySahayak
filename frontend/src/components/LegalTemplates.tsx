"use client";
// frontend/src/components/LegalTemplates.tsx
import { useState, useEffect } from "react";
import { X, FileText, Download, Loader2, ChevronLeft, Languages } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Template { id: string; icon: string; title: string; desc: string; }
interface Props { onClose: () => void; }

type FieldType = {
  id: string;
  label: string;       // English label
  labelHi: string;     // Hindi label
  placeholder: string;
  placeholderHi: string;
  type?: string;
  required?: boolean;
  inputType?: "text" | "date" | "number" | "select" | "textarea";
  options?: string[];   // for select
};

// ── Field definitions ────────────────────────────────────────────────────────
const FIELDS: Record<string, FieldType[]> = {
  legal_notice: [
    { id: "sender_name",       label: "Your Name",              labelHi: "आपका नाम",               placeholder: "Ramesh Kumar",           placeholderHi: "रमेश कुमार",          required: true },
    { id: "sender_address",    label: "Your Address",           labelHi: "आपका पता",               placeholder: "123, MG Road, Delhi",    placeholderHi: "123, एमजी रोड, दिल्ली", required: true },
    { id: "recipient_name",    label: "Recipient Name",         labelHi: "प्राप्तकर्ता का नाम",     placeholder: "ABC Company / Mr. Sharma", placeholderHi: "एबीसी कंपनी / श्री शर्मा", required: true },
    { id: "recipient_address", label: "Recipient Address",      labelHi: "प्राप्तकर्ता का पता",     placeholder: "456, Park Street, Mumbai", placeholderHi: "456, पार्क स्ट्रीट, मुंबई", required: true },
    { id: "subject",           label: "Subject of Notice",      labelHi: "नोटिस का विषय",           placeholder: "Recovery of due amount", placeholderHi: "बकाया राशि की वसूली", required: true },
    { id: "notice_type",       label: "Notice Type",            labelHi: "नोटिस का प्रकार",         placeholder: "Demand Notice",          placeholderHi: "मांग नोटिस" },
    { id: "amount_claimed",    label: "Amount Claimed (₹)",     labelHi: "दावा राशि (₹)",           placeholder: "50000",                  placeholderHi: "50000",                inputType: "number" },
    { id: "days_to_comply",    label: "Days to Comply",         labelHi: "अनुपालन के लिए दिन",      placeholder: "15",                     placeholderHi: "15",                   inputType: "number" },
    { id: "content",           label: "Details of Dispute",     labelHi: "विवाद का विवरण",          placeholder: "Describe the issue…",    placeholderHi: "समस्या का विवरण लिखें…", required: true, inputType: "textarea" },
  ],
  court_petition: [
    { id: "petitioner_name",    label: "Petitioner Name",     labelHi: "याचिकाकर्ता का नाम",   placeholder: "Your full name",          placeholderHi: "आपका पूरा नाम",       required: true },
    { id: "petitioner_address", label: "Petitioner Address",  labelHi: "याचिकाकर्ता का पता",   placeholder: "Your address",            placeholderHi: "आपका पता",            required: true },
    { id: "respondent_name",    label: "Respondent Name",     labelHi: "प्रतिवादी का नाम",     placeholder: "Opposite party",          placeholderHi: "विपरीत पक्ष",         required: true },
    { id: "respondent_address", label: "Respondent Address",  labelHi: "प्रतिवादी का पता",     placeholder: "Their address",           placeholderHi: "उनका पता",            required: true },
    { id: "court_name",         label: "Court Name",          labelHi: "न्यायालय का नाम",      placeholder: "District Court, Delhi",   placeholderHi: "जिला न्यायालय, दिल्ली", required: true },
    { id: "case_type",          label: "Case Type",           labelHi: "मामले का प्रकार",      placeholder: "Civil / Criminal",        placeholderHi: "दीवानी / आपराधिक",    required: true,
      inputType: "select", options: ["Civil", "Criminal", "Family", "Consumer", "Labour", "Other"] },
    { id: "facts_of_case",      label: "Facts of the Case",   labelHi: "मामले के तथ्य",        placeholder: "Explain what happened…",  placeholderHi: "क्या हुआ समझाएं…",    required: true, inputType: "textarea" },
    { id: "relief_sought",      label: "Relief Sought",       labelHi: "मांगी गई राहत",        placeholder: "What you want the court to order…", placeholderHi: "न्यायालय से क्या आदेश चाहते हैं…", required: true, inputType: "textarea" },
    { id: "prayer",             label: "Prayer",              labelHi: "प्रार्थना",             placeholder: "Your specific prayer to the court", placeholderHi: "न्यायालय से विशेष प्रार्थना", required: true, inputType: "textarea" },
  ],
  affidavit: [
    { id: "deponent_name",  label: "Deponent Name",        labelHi: "शपथकर्ता का नाम",      placeholder: "Your full name",      placeholderHi: "आपका पूरा नाम",   required: true },
    { id: "father_name",    label: "Father's Name",        labelHi: "पिता का नाम",           placeholder: "Father's name",       placeholderHi: "पिता का नाम",     required: true },
    { id: "age",            label: "Age",                  labelHi: "आयु",                   placeholder: "35",                  placeholderHi: "35",               required: true, inputType: "number" },
    { id: "gender",         label: "Gender",               labelHi: "लिंग",                  placeholder: "",                    placeholderHi: "",
      required: true, inputType: "select", options: ["Male / पुरुष", "Female / महिला", "Other / अन्य"] },
    { id: "address",        label: "Address",              labelHi: "पता",                   placeholder: "Your full address",   placeholderHi: "आपका पूरा पता",   required: true },
    { id: "purpose",        label: "Purpose of Affidavit", labelHi: "शपथपत्र का उद्देश्य", placeholder: "e.g. Change of name", placeholderHi: "जैसे नाम परिवर्तन", required: true },
    { id: "statements",     label: "Statements / Facts",   labelHi: "कथन / तथ्य",           placeholder: "Facts you are swearing to be true…", placeholderHi: "जो तथ्य आप सत्य मानते हैं…", required: true, inputType: "textarea" },
    { id: "city",           label: "City",                 labelHi: "शहर",                   placeholder: "New Delhi",           placeholderHi: "नई दिल्ली",       required: true },
    { id: "date",           label: "Date",                 labelHi: "तारीख",                 placeholder: "",                    placeholderHi: "",                 required: true, inputType: "date" },
  ],
  rental_agreement: [
    { id: "landlord_name",    label: "Landlord Name",       labelHi: "मकान मालिक का नाम",  placeholder: "Owner's full name",     placeholderHi: "मालिक का पूरा नाम",  required: true },
    { id: "tenant_name",      label: "Tenant Name",         labelHi: "किरायेदार का नाम",    placeholder: "Tenant's full name",    placeholderHi: "किरायेदार का पूरा नाम", required: true },
    { id: "property_address", label: "Property Address",    labelHi: "संपत्ति का पता",      placeholder: "Full address of property", placeholderHi: "संपत्ति का पूरा पता", required: true },
    { id: "monthly_rent",     label: "Monthly Rent (₹)",    labelHi: "मासिक किराया (₹)",    placeholder: "15000",                 placeholderHi: "15000",              required: true, inputType: "number" },
    { id: "security_deposit", label: "Security Deposit (₹)",labelHi: "सुरक्षा जमा (₹)",    placeholder: "30000",                 placeholderHi: "30000",              required: true, inputType: "number" },
    { id: "duration_months",  label: "Duration (months)",   labelHi: "अवधि (महीने)",        placeholder: "11",                    placeholderHi: "11",                 required: true, inputType: "number" },
    { id: "start_date",       label: "Start Date",          labelHi: "प्रारंभ तिथि",        placeholder: "",                      placeholderHi: "",                   required: true, inputType: "date" },
    { id: "city",             label: "City",                labelHi: "शहर",                 placeholder: "Mumbai",                placeholderHi: "मुंबई",             required: true },
  ],
  sale_agreement: [
    { id: "seller_name",          label: "Seller Name",          labelHi: "विक्रेता का नाम",       placeholder: "Full name of seller",          placeholderHi: "विक्रेता का पूरा नाम", required: true },
    { id: "buyer_name",           label: "Buyer Name",           labelHi: "क्रेता का नाम",         placeholder: "Full name of buyer",           placeholderHi: "क्रेता का पूरा नाम",  required: true },
    { id: "property_description", label: "Property Description", labelHi: "संपत्ति का विवरण",      placeholder: "Plot No. 12, Sector 5, Noida…", placeholderHi: "प्लॉट नं. 12, सेक्टर 5, नोएडा…", required: true, inputType: "textarea" },
    { id: "sale_price",           label: "Sale Price (₹)",       labelHi: "बिक्री मूल्य (₹)",      placeholder: "5000000",                      placeholderHi: "5000000",              required: true, inputType: "number" },
    { id: "advance_paid",         label: "Advance Paid (₹)",     labelHi: "अग्रिम राशि (₹)",       placeholder: "500000",                       placeholderHi: "500000",               required: true, inputType: "number" },
    { id: "balance_amount",       label: "Balance Amount (₹)",   labelHi: "शेष राशि (₹)",          placeholder: "4500000",                      placeholderHi: "4500000",              required: true, inputType: "number" },
    { id: "registration_date",    label: "Registration By",      labelHi: "पंजीकरण की तिथि",       placeholder: "",                             placeholderHi: "",                     required: true, inputType: "date" },
    { id: "city",                 label: "City",                 labelHi: "शहर",                   placeholder: "Noida",                        placeholderHi: "नोएडा",               required: true },
  ],
  fir_draft: [
    { id: "full_name",            label: "Complainant Full Name",      labelHi: "शिकायतकर्ता का पूरा नाम",  placeholder: "Ramesh Kumar",           placeholderHi: "रमेश कुमार",         required: true },
    { id: "father_name",          label: "Father's / Husband's Name",  labelHi: "पिता/पति का नाम",           placeholder: "Suresh Kumar",           placeholderHi: "सुरेश कुमार",        required: true },
    { id: "age",                  label: "Age",                        labelHi: "आयु",                       placeholder: "35",                     placeholderHi: "35",                 required: true, inputType: "number" },
    { id: "gender",               label: "Gender",                     labelHi: "लिंग",                      placeholder: "",                       placeholderHi: "",
      required: true, inputType: "select", options: ["Female / महिला", "Male / पुरुष", "Other / अन्य"] },
    { id: "contact",              label: "Mobile Number",              labelHi: "मोबाइल नंबर",               placeholder: "9876543210",             placeholderHi: "9876543210",          required: true },
    { id: "email",                label: "Email",                      labelHi: "ईमेल",                      placeholder: "you@example.com",        placeholderHi: "aap@example.com" },
    { id: "occupation",           label: "Occupation",                 labelHi: "व्यवसाय",                   placeholder: "Teacher / Farmer / etc.", placeholderHi: "शिक्षक / किसान / आदि" },
    { id: "address_line1",        label: "Address Line 1",             labelHi: "पता पंक्ति 1",              placeholder: "House No., Street",      placeholderHi: "मकान नं., गली",      required: true },
    { id: "city",                 label: "City",                       labelHi: "शहर",                       placeholder: "New Delhi",              placeholderHi: "नई दिल्ली",          required: true },
    { id: "district",             label: "District",                   labelHi: "जिला",                      placeholder: "South Delhi",            placeholderHi: "दक्षिण दिल्ली",      required: true },
    { id: "state",                label: "State",                      labelHi: "राज्य",                     placeholder: "Delhi",                  placeholderHi: "दिल्ली",             required: true },
    { id: "pincode",              label: "Pincode",                    labelHi: "पिनकोड",                    placeholder: "110001",                 placeholderHi: "110001",             required: true },
    { id: "police_station",       label: "Police Station",             labelHi: "पुलिस थाना",                placeholder: "Lajpat Nagar PS",        placeholderHi: "लाजपत नगर थाना",     required: true },
    { id: "incident_date",        label: "Date of Incident",           labelHi: "घटना की तारीख",             placeholder: "",                       placeholderHi: "",                   required: true, inputType: "date" },
    { id: "incident_time",        label: "Time of Incident",           labelHi: "घटना का समय",               placeholder: "10:30 PM",               placeholderHi: "रात 10:30 बजे" },
    { id: "incident_location",    label: "Place of Incident",          labelHi: "घटना का स्थान",             placeholder: "Full address",           placeholderHi: "पूरा पता",           required: true },
    { id: "accused_details",      label: "Accused Details",            labelHi: "आरोपी का विवरण",            placeholder: "Name, address, relation (if known)", placeholderHi: "नाम, पता, संबंध (यदि ज्ञात हो)", inputType: "textarea" },
    { id: "incident_description", label: "Full Description of Incident",labelHi: "घटना का पूरा विवरण",       placeholder: "Describe exactly what happened…", placeholderHi: "क्या हुआ बिल्कुल सही लिखें…", required: true, inputType: "textarea" },
    { id: "witnesses",            label: "Witnesses (if any)",         labelHi: "गवाह (यदि कोई हो)",         placeholder: "Name and contact of witnesses", placeholderHi: "गवाहों के नाम और संपर्क" },
    { id: "property_involved",    label: "Property Stolen / Damaged",  labelHi: "चोरी/क्षतिग्रस्त संपत्ति", placeholder: "Description and value",  placeholderHi: "विवरण और मूल्य" },
  ],
  employment_offer: [
    { id: "company_name",     label: "Company Name",           labelHi: "कंपनी का नाम",         placeholder: "ABC Technologies Pvt Ltd", placeholderHi: "एबीसी टेक्नोलॉजीज प्रा. लि.", required: true },
    { id: "company_address",  label: "Company Address",        labelHi: "कंपनी का पता",         placeholder: "Full address",             placeholderHi: "पूरा पता",                    required: true },
    { id: "candidate_name",   label: "Candidate Name",         labelHi: "उम्मीदवार का नाम",     placeholder: "Full name",                placeholderHi: "पूरा नाम",                    required: true },
    { id: "position",         label: "Position / Designation", labelHi: "पद / पदनाम",           placeholder: "Software Engineer",        placeholderHi: "सॉफ्टवेयर इंजीनियर",         required: true },
    { id: "department",       label: "Department",             labelHi: "विभाग",                 placeholder: "Engineering",              placeholderHi: "इंजीनियरिंग",               required: true },
    { id: "annual_ctc",       label: "Annual CTC (₹)",         labelHi: "वार्षिक सीटीसी (₹)",  placeholder: "600000",                   placeholderHi: "600000",                      required: true, inputType: "number" },
    { id: "joining_date",     label: "Date of Joining",        labelHi: "ज्वाइनिंग की तारीख", placeholder: "",                         placeholderHi: "",                            required: true, inputType: "date" },
    { id: "reporting_to",     label: "Reporting To",           labelHi: "रिपोर्टिंग किसे",     placeholder: "Team Lead / Manager name", placeholderHi: "टीम लीड / मैनेजर का नाम" },
    { id: "probation_months", label: "Probation Period (months)", labelHi: "परिवीक्षा अवधि (महीने)", placeholder: "6",                  placeholderHi: "6",                           inputType: "number" },
  ],
};

// Format date from YYYY-MM-DD to DD/MM/YYYY for PDF
function formatDateForPdf(val: string) {
  if (!val) return val;
  const parts = val.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return val;
}

export default function LegalTemplates({ onClose }: Props) {
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [selected, setSelected]     = useState<Template | null>(null);
  const [formData, setFormData]     = useState<Record<string, string>>({});
  const [hindi, setHindi]           = useState(false);
  const [generating, setGenerating] = useState(false);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [error, setError]           = useState("");

  useEffect(() => {
    fetch(`${API}/api/documents/templates`)
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {});
  }, []);

  function set(k: string, v: string) {
    setFormData(prev => ({ ...prev, [k]: v }));
  }

  async function handleGenerate() {
    if (!selected) return;
    setGenerating(true); setError("");
    try {
      // Format date fields to DD/MM/YYYY before sending
      const sendData: Record<string, string> = {};
      const fields = FIELDS[selected.id] ?? [];
      for (const [k, v] of Object.entries(formData)) {
        const field = fields.find(f => f.id === k);
        sendData[k] = field?.inputType === "date" ? formatDateForPdf(v) : v;
      }
      // Append Hindi label if mode is Hindi
      if (hindi) sendData["_lang"] = "hi";

      let res;
      if (selected.id === "fir_draft") {
        res = await fetch(`${API}/api/documents/fir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_data: sendData, proof_images: proofImages }),
        });
      } else {
        res = await fetch(`${API}/api/documents/templates/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: selected.id, data: sendData }),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Generation failed");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${selected.id.replace(/_/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally { setGenerating(false); }
  }

  const fields      = selected ? FIELDS[selected.id] ?? [] : [];
  const required    = fields.filter(f => f.required);
  const canGenerate = required.every(f => formData[f.id]?.trim());

  const inputCls  = `w-full rounded-xl px-3 py-2.5 text-[0.875rem] border focus:outline-none transition-all`;
  const iStyle    = { background: "var(--bg-3)", borderColor: "rgba(255,255,255,0.1)", color: "var(--text)" };
  const labelCls  = "text-[0.65rem] uppercase tracking-widest mb-1.5 block";
  const lStyle    = { color: "var(--text-3)" };

  function renderField(f: FieldType) {
    const label       = hindi ? f.labelHi : f.label;
    const placeholder = hindi ? f.placeholderHi : f.placeholder;

    if (f.inputType === "textarea") {
      return (
        <div key={f.id}>
          <label className={labelCls} style={lStyle}>
            {label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <textarea
            value={formData[f.id] || ""}
            onChange={e => set(f.id, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={`${inputCls} resize-none`}
            style={iStyle}
          />
        </div>
      );
    }

    if (f.inputType === "select" && f.options) {
      return (
        <div key={f.id}>
          <label className={labelCls} style={lStyle}>
            {label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <select
            value={formData[f.id] || ""}
            onChange={e => set(f.id, e.target.value)}
            className={inputCls}
            style={iStyle}
          >
            <option value="">— {hindi ? "चुनें" : "Select"} —</option>
            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    if (f.inputType === "date") {
      return (
        <div key={f.id}>
          <label className={labelCls} style={lStyle}>
            {label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            type="date"
            value={formData[f.id] || ""}
            onChange={e => set(f.id, e.target.value)}
            className={inputCls}
            style={iStyle}
          />
        </div>
      );
    }

    if (f.inputType === "number") {
      return (
        <div key={f.id}>
          <label className={labelCls} style={lStyle}>
            {label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            type="number"
            value={formData[f.id] || ""}
            onChange={e => set(f.id, e.target.value)}
            placeholder={placeholder}
            className={inputCls}
            style={iStyle}
          />
        </div>
      );
    }

    // Default text
    return (
      <div key={f.id}>
        <label className={labelCls} style={lStyle}>
          {label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <input
          value={formData[f.id] || ""}
          onChange={e => set(f.id, e.target.value)}
          placeholder={placeholder}
          className={inputCls}
          style={iStyle}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--bg-2)" }}>
        <div className="flex items-center gap-3">
          {selected && (
            <button onClick={() => { setSelected(null); setFormData({}); setError(""); setProofImages([]); }}
              className="p-1.5 rounded-xl transition-colors" style={{ color: "var(--text-3)" }}>
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h2 className="font-display text-xl" style={{ color: "var(--gold-light)" }}>
              📝 Legal Templates
            </h2>
            <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--text-3)" }}>
              {selected ? selected.title : "Ready-to-download legal documents"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <button
              onClick={() => setHindi(h => !h)}
              title={hindi ? "Switch to English" : "हिंदी में भरें"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] font-medium transition-all"
              style={{
                background: hindi ? "rgba(255,153,0,0.15)" : "var(--bg-3)",
                border: hindi ? "1px solid rgba(255,153,0,0.35)" : "1px solid var(--border)",
                color: hindi ? "#fbbf24" : "var(--text-2)",
              }}>
              <Languages size={13} />
              {hindi ? "हिंदी" : "Hindi"}
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--text-3)" }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Template grid */}
      {!selected && (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t, i) => (
              <button key={t.id} onClick={() => { setSelected(t); setFormData({}); setProofImages([]); setHindi(false); }}
                className="text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-up"
                style={{ background: "var(--bg-2)", borderColor: "rgba(255,255,255,0.07)",
                         animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}>
                <span className="text-2xl block mb-2">{t.icon}</span>
                <p className="text-[0.85rem] font-medium mb-1" style={{ color: "var(--text)" }}>{t.title}</p>
                <p className="text-[0.72rem] leading-relaxed" style={{ color: "var(--text-3)" }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {selected && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-[0.8rem]"
              style={{ background: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Hindi mode banner */}
          {hindi && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-[0.78rem]"
              style={{ background: "rgba(255,153,0,0.07)", border: "1px solid rgba(255,153,0,0.25)", color: "#fbbf24" }}>
              🇮🇳 <span>हिंदी मोड चालू है — सभी प्रश्न और उत्तर हिंदी में हैं।</span>
            </div>
          )}

          {fields.map(renderField)}

          {/* Proof image upload */}
          <div className="space-y-2">
            <label className={`${labelCls} flex items-center gap-1`} style={lStyle}>
              📎 {hindi ? "साक्ष्य / प्रमाण फ़ोटो संलग्न करें" : "Attach Evidence / Proof Images"}
              <span className="normal-case text-[0.6rem]">
                ({hindi ? "वैकल्पिक, PDF में एम्बेड" : "optional, embedded in PDF"})
              </span>
            </label>
            <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:opacity-90"
              style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              <span className="text-base">📷</span>
              <span className="text-[0.82rem]" style={{ color: "var(--text-2)" }}>
                {hindi ? "फ़ोटो / स्क्रीनशॉट जोड़ें" : "Add photos / screenshots"}
              </span>
              <input type="file" className="hidden" accept="image/*" multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  const b64s = await Promise.all(files.map(f => new Promise<string>((res) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.readAsDataURL(f);
                  })));
                  setProofImages(prev => [...prev, ...b64s]);
                  e.target.value = "";
                }} />
            </label>
            {proofImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {proofImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt={`Proof ${i+1}`}
                      className="w-16 h-16 object-cover rounded-lg border"
                      style={{ borderColor: "var(--border-md)" }} />
                    <button onClick={() => setProofImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[0.6rem]
                        flex items-center justify-center"
                      style={{ background: "var(--danger)", color: "#fff" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 pb-4">
            <button onClick={handleGenerate} disabled={!canGenerate || generating}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: canGenerate && !generating
                  ? "linear-gradient(135deg, var(--gold), #b45309)" : "var(--bg-4)",
                color: canGenerate && !generating ? "#000" : "var(--text-3)"
              }}>
              {generating
                ? <><Loader2 size={14} className="animate-spin" /> {hindi ? "PDF बना रहे हैं…" : "Generating PDF…"}</>
                : <><Download size={14} /> {hindi ? `${selected.title} डाउनलोड करें` : `Download ${selected.title}`}</>}
            </button>
            {!canGenerate && (
              <p className="text-[0.68rem] text-center mt-2" style={{ color: "var(--text-3)" }}>
                {hindi ? "PDF डाउनलोड करने के लिए सभी आवश्यक (*) फ़ील्ड भरें" : "Fill in all required (*) fields to download"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
