# backend/routers/voice.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import base64
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.ai_client import call_asr_api, call_tts_api

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/asr")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = Form("hi"),
):
    """
    Receive WAV audio (recorded by browser Web Audio API) and transcribe via Bhashini.
    Frontend sends 16kHz mono WAV directly — no conversion needed.
    """
    audio_bytes = await file.read()
    print(f"ASR → lang={language}, size={len(audio_bytes)}B, type={file.content_type}")

    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio too short — speak for at least 1 second")

    audio_b64 = base64.b64encode(audio_bytes).decode()
    text = call_asr_api(audio_b64, language)

    if not text or not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not transcribe. Please speak clearly in a quiet environment."
        )

    print(f"ASR ✅ result: '{text.strip()}'")
    return {"text": text.strip(), "language": language}


class TTSRequest(BaseModel):
    text: str
    language: str = "hi"


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """Convert text → speech via Bhashini TTS."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    print(f"TTS → lang={req.language}, chars={len(req.text)}")
    audio_bytes = call_tts_api(req.text, req.language)

    if not audio_bytes:
        raise HTTPException(status_code=503, detail="Bhashini TTS unavailable for this language.")

    return {"audio_base64": base64.b64encode(audio_bytes).decode(), "language": req.language}
