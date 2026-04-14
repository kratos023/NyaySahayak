# backend/routers/ocr.py
"""
OCR endpoint — extract text from images of legal documents using Gemini Vision.
No Tesseract required; Gemini 2.0 Flash handles images natively.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import base64
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

router = APIRouter(prefix="/ocr", tags=["ocr"])

SUPPORTED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"}


@router.post("/extract")
async def extract_text_from_image(
    file: UploadFile = File(...),
    language: str = Form("en"),
    user_id: str = Form("anonymous"),
):
    """
    Extract text from an image of a legal document using Gemini Vision.
    Automatically analyzes the extracted text and returns both raw text + summary.
    """
    from utils.ai_client import client, GEMINI_AVAILABLE, GEMINI_MODELS, analyze_legal_document
    from google.genai import types as genai_types

    content_type = (file.content_type or "").lower()
    if content_type not in SUPPORTED_TYPES and not file.filename.lower().endswith(
        (".jpg", ".jpeg", ".png", ".webp", ".heic")
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a JPG, PNG, or WebP image."
        )

    if not GEMINI_AVAILABLE or client is None:
        raise HTTPException(status_code=503, detail="AI service unavailable")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image too large. Max size is 10MB.")

    image_b64 = base64.b64encode(image_bytes).decode()
    mime = content_type if content_type in SUPPORTED_TYPES else "image/jpeg"

    extract_prompt = """You are an OCR assistant. Extract ALL text visible in this image exactly as written.
This may be a legal document, court notice, FIR, land record, government letter, or similar.

Instructions:
- Extract every word, number, date, and name visible
- Preserve the structure (headings, paragraphs, tables) as much as possible
- If text is in Hindi or another Indian language, extract it in that script
- If handwritten, do your best to read it
- Return ONLY the extracted text, nothing else"""

    extracted_text = None

    # Use only vision-capable models
    vision_models = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"]

    for model_name in vision_models:
        try:
            from google.genai import types as genai_types

            response = client.models.generate_content(
                model=model_name,
                contents=genai_types.Content(
                    role="user",
                    parts=[
                        genai_types.Part(
                            inline_data=genai_types.Blob(
                                mime_type=mime,
                                data=image_bytes   # raw bytes, not base64
                            )
                        ),
                        genai_types.Part(text=extract_prompt),
                    ]
                ),
                config=genai_types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=3000,
                )
            )
            if response and response.text:
                extracted_text = response.text.strip()
                print(f"✅ OCR success with {model_name}, {len(extracted_text)} chars")
                break
        except Exception as e:
            print(f"OCR model {model_name} failed: {e}")
            continue

    if not extracted_text:
        raise HTTPException(status_code=422, detail="Could not extract text from image. Please ensure the image is clear and well-lit.")

    # Step 2: Analyze the extracted text
    analysis = None
    suggestions = None
    if len(extracted_text) > 50:
        try:
            analysis = analyze_legal_document(extracted_text, file.filename or "image", language)

            # Store in conversation context
            from routers.chat import get_context
            ctx = get_context(user_id)
            ctx.add_message("user", f"I have this document: {extracted_text[:400]}", "English")
            ctx.add_message("assistant", f"Document analysis: {analysis[:500]}", "English")

            # Build suggestions
            from utils.suggestions import build_suggestions
            suggestions = build_suggestions(
                user_query=extracted_text[:500],
                ai_response=analysis,
                client=None, models=[]
            )
        except Exception as e:
            print(f"Analysis after OCR failed: {e}")

    return {
        "extracted_text": extracted_text,
        "char_count":     len(extracted_text),
        "analysis":       analysis,
        "suggestions":    suggestions,
        "filename":       file.filename,
    }
