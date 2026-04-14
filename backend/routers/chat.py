# backend/routers/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.ai_client import (
    query_legal_ai, call_translation_api, call_tts_api,
    LANGUAGES, GEMINI_AVAILABLE
)
from utils.suggestions import build_suggestions, detect_topics
from utils.context_memory import ContextMemory
from utils.database import db

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory context store keyed by user_id
# For production, move this to Redis
_contexts: dict[str, ContextMemory] = {}

def get_context(user_id: str) -> ContextMemory:
    if user_id not in _contexts:
        _contexts[user_id] = ContextMemory(max_messages=4)
    return _contexts[user_id]


class ChatRequest(BaseModel):
    user_id: str
    message: str
    input_language: str = "English"
    output_language: str = "English"
    enable_tts: bool = False


class ChatResponse(BaseModel):
    reply: str
    reply_translated: str
    audio_base64: Optional[str] = None
    suggestions: Optional[dict] = None
    input_language: str
    output_language: str


@router.post("/message", response_model=ChatResponse)
async def send_message(req: ChatRequest):
    input_lang_code  = LANGUAGES.get(req.input_language,  {}).get("code", "en")
    output_lang_code = LANGUAGES.get(req.output_language, {}).get("code", "en")

    # Translate input to English for AI processing
    english_input = req.message
    if input_lang_code != "en":
        translated = call_translation_api(req.message, input_lang_code, "en")
        if translated:
            english_input = translated

    # Get conversation context
    ctx = get_context(req.user_id)
    context_prompt = ctx.get_context_prompt()

    # Query AI — pass output language so Gemini responds directly in it
    # This preserves markdown formatting (translation destroys it)
    ai_reply = query_legal_ai(english_input, context_prompt, output_lang_code)

    # Update context (always store English version for context coherence)
    ctx.add_message("user", english_input, req.input_language)
    ctx.add_message("assistant", ai_reply, req.output_language)

    # TTS (optional)
    audio_b64 = None
    if req.enable_tts:
        audio_bytes = call_tts_api(ai_reply[:500], output_lang_code)
        if audio_bytes:
            import base64
            audio_b64 = base64.b64encode(audio_bytes).decode()

    # ── Save to database directly (no Streamlit dependency) ──────────────────
    try:
        # Get or create active session for this user
        active = db.get_active_session(req.user_id)
        if active:
            session_id = active["id"]
        else:
            # Name session after first user message
            session_name = req.message[:30] + "…" if len(req.message) > 30 else req.message
            session_data = db.create_chat_session(req.user_id, session_name, "Legal Query")
            session_id = session_data["session_id"] if session_data else None

        if session_id:
            seq = len(ctx.history)
            db.save_message(session_id, "user",      req.message, seq - 2)
            db.save_message(session_id, "assistant", ai_reply,    seq - 1)
    except Exception as e:
        print(f"DB save error (non-critical): {e}")

    # Build suggestions — pass Gemini client so follow-ups are generated from actual context
    suggestions = None
    try:
        from utils.ai_client import client as gemini_client, GEMINI_MODELS, GEMINI_AVAILABLE
        suggestions = build_suggestions(
            user_query=english_input,
            ai_response=ai_reply,
            client=gemini_client if GEMINI_AVAILABLE else None,
            models=GEMINI_MODELS
        )
    except Exception as e:
        print(f"Suggestions error: {e}")

    return ChatResponse(
        reply=ai_reply,
        reply_translated=ai_reply,   # same — Gemini already replied in target language
        audio_base64=audio_b64,
        suggestions=suggestions,
        input_language=req.input_language,
        output_language=req.output_language,
    )


@router.post("/clear-context")
async def clear_context(user_id: str):
    if user_id in _contexts:
        _contexts[user_id].clear()
    return {"status": "cleared"}


@router.get("/languages")
async def get_languages():
    return {"languages": LANGUAGES}


@router.get("/status")
async def get_status():
    return {"gemini_available": GEMINI_AVAILABLE}
