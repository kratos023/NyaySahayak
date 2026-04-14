// frontend/src/lib/api.ts
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Message {
  role: "user" | "assistant";
  content: string;
  language?: string;
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  reply_translated: string;
  audio_base64?: string;
  suggestions?: Suggestions;
  input_language: string;
  output_language: string;
}

export interface Suggestions {
  topics: string[];
  helplines: [string, string][];
  cases: string[];
  followups: string[];
  show_fir: boolean;
  show_report: boolean;
}

export interface Session {
  id: number;
  session_uuid: string;
  session_name: string;
  intent_label: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_display: string;
  updated_display: string;
}

export interface LocationResult {
  location: string;
  places: { label: string; desc: string; url: string }[];
  helplines: { name: string; number: string; color: string }[];
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export async function sendMessage(payload: {
  user_id: string;
  message: string;
  input_language: string;
  output_language: string;
  enable_tts: boolean;
}): Promise<ChatResponse> {
  const res = await fetch(`${API}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLanguages(): Promise<Record<string, { code: string; emoji: string; name: string }>> {
  const res = await fetch(`${API}/api/chat/languages`);
  const data = await res.json();
  return data.languages;
}

export async function getStatus(): Promise<{ gemini_available: boolean }> {
  const res = await fetch(`${API}/api/chat/status`);
  return res.json();
}

export async function clearContext(userId: string): Promise<void> {
  await fetch(`${API}/api/chat/clear-context?user_id=${userId}`, { method: "POST" });
}

// ── Sessions ─────────────────────────────────────────────────────────────────
export async function getSessions(userId: string): Promise<Session[]> {
  const res = await fetch(`${API}/api/sessions/${userId}`);
  const data = await res.json();
  return data.sessions ?? [];
}

export async function getSessionMessages(sessionId: number): Promise<Message[]> {
  const res = await fetch(`${API}/api/sessions/${sessionId}/messages`);
  const data = await res.json();
  return data.messages ?? [];
}

export async function deleteSession(sessionId: number): Promise<void> {
  await fetch(`${API}/api/sessions/${sessionId}`, { method: "DELETE" });
}

export async function newSession(userId: string): Promise<void> {
  await fetch(`${API}/api/sessions/new?user_id=${userId}`, { method: "POST" });
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function analyzeDocument(file: File, language: string, userId?: string): Promise<{ analysis: string; filename: string; char_count: number; suggestions?: Suggestions }> {
  const form = new FormData();
  form.append("file", file);
  form.append("language", language);
  if (userId) form.append("user_id", userId);
  const res = await fetch(`${API}/api/documents/analyze`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateFIR(userData: Record<string, unknown>): Promise<Blob> {
  const res = await fetch(`${API}/api/documents/fir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export async function generateReport(userData: Record<string, unknown>, intentLabel: string): Promise<Blob> {
  const res = await fetch(`${API}/api/documents/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_data: userData, intent_label: intentLabel }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

// ── Voice ─────────────────────────────────────────────────────────────────────
export async function transcribeAudio(file: File, language: string): Promise<{ text: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("language", language);
  const res = await fetch(`${API}/api/voice/asr`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function synthesizeSpeech(text: string, language: string): Promise<{ audio_base64: string }> {
  const res = await fetch(`${API}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Locations ─────────────────────────────────────────────────────────────────
export async function searchLocations(location: string): Promise<LocationResult> {
  const res = await fetch(`${API}/api/locations/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getStates(): Promise<string[]> {
  const res = await fetch(`${API}/api/locations/states`);
  const data = await res.json();
  return data.states ?? [];
}

export async function getCommission(state: string): Promise<{ name: string; phone: string; website: string }> {
  const res = await fetch(`${API}/api/locations/commission/${encodeURIComponent(state)}`);
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getUserId(): string {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem("nyay_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("nyay_user_id", id);
  }
  return id;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
