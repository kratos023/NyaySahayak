# ⚖️ Nyay-Sahayak v2.0 — Full-Stack Migration

## Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) + SQLite
- **AI**: Gemini 2.0 Flash + Bhashini (ASR / TTS / Translation)

---

## Project Structure

```
nyayshakti/
├── backend/
│   ├── main.py                  ← FastAPI entry point
│   ├── requirements.txt
│   ├── .env                     ← API keys (don't commit)
│   ├── routers/
│   │   ├── chat.py              ← POST /api/chat/message
│   │   ├── sessions.py          ← GET/DELETE /api/sessions
│   │   ├── documents.py         ← POST /api/documents/analyze|fir|report
│   │   ├── voice.py             ← POST /api/voice/asr|tts
│   │   └── locations.py        ← POST /api/locations/search
│   └── utils/
│       ├── ai_client.py         ← Gemini + Bhashini logic (no Streamlit)
│       ├── context_memory.py    ← Per-user conversation context
│       ├── database.py          ← SQLite (persistent, no DROP TABLE)
│       ├── suggestions.py       ← Contextual suggestion chips
│       ├── fir_generator.py     ← FIR PDF generation
│       ├── pdf_generator.py     ← Comprehensive report PDF
│       └── legal_templates.py  ← Legal notice / petition templates
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── .env.local               ← NEXT_PUBLIC_API_URL
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx         ← Root page (wires everything)
        │   └── globals.css      ← Design tokens + prose styles
        ├── components/
        │   ├── Sidebar.tsx      ← Chat history + language settings
        │   ├── ChatWindow.tsx   ← Message list + input bar
        │   ├── MessageBubble.tsx← User/AI bubbles + markdown
        │   ├── SuggestionChips.tsx ← Follow-ups, cases, helplines
        │   ├── LocationFinder.tsx  ← Google Maps links + helplines
        │   └── DocumentPanel.tsx   ← File upload + AI analysis
        └── lib/
            └── api.ts           ← Typed fetch client for all endpoints
```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs at: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App at: http://localhost:3000

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chat/message | Send a legal query, get AI reply + suggestions |
| GET  | /api/chat/languages | Get all supported languages |
| GET  | /api/sessions/{user_id} | Get chat history for a user |
| DELETE | /api/sessions/{id} | Delete a session |
| POST | /api/documents/analyze | Upload + analyze a legal document |
| POST | /api/documents/fir | Generate FIR PDF |
| POST | /api/documents/report | Generate comprehensive legal report PDF |
| POST | /api/voice/asr | Audio file → transcribed text (Bhashini) |
| POST | /api/voice/tts | Text → audio bytes (Bhashini) |
| POST | /api/locations/search | Get Google Maps links for a location |
| GET  | /api/locations/helplines | All emergency helplines |
| GET  | /api/locations/commission/{state} | State women's commission details |

---

## Deployment

### Backend → Railway / Render
```bash
# Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend → Vercel
```bash
cd frontend
vercel deploy
# Set env: NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## What changed from Streamlit

| Old (Streamlit) | New |
|-----------------|-----|
| `st.session_state` for context | `ContextMemory` class per user in FastAPI |
| `st.chat_input` | React `<textarea>` with Enter-to-send |
| `st.sidebar` | `<Sidebar>` React component |
| Suggestion chips via `st.button` rerun hack | Direct React state — no page reload |
| `st.file_uploader` | `<input type="file">` with FormData upload |
| SQLite DROP TABLE bug | Fixed — `CREATE TABLE IF NOT EXISTS` |
| Single-file monolith (2600 lines) | Modular routers + components |
