# backend/routers/documents.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.ai_client import analyze_legal_document, generate_legal_advice_for_report, call_translation_api

router = APIRouter(prefix="/documents", tags=["documents"])


def extract_text(file_bytes: bytes, filename: str, content_type: str) -> tuple[str, Optional[str]]:
    """Extract text from uploaded file. Returns (text, error)."""
    try:
        if content_type == "text/plain":
            return file_bytes.decode("utf-8", errors="ignore"), None

        elif content_type == "application/pdf":
            try:
                import PyPDF2, io
                reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                text = "\n".join(p.extract_text() or "" for p in reader.pages)
                return text, None
            except ImportError:
                return "", "PyPDF2 not installed. Run: pip install PyPDF2"

        elif "wordprocessingml" in content_type or "msword" in content_type:
            try:
                import docx, io
                doc = docx.Document(io.BytesIO(file_bytes))
                text = "\n".join(p.text for p in doc.paragraphs if p.text)
                return text, None
            except ImportError:
                return "", "python-docx not installed. Run: pip install python-docx"

        return "", f"Unsupported file type: {content_type}"
    except Exception as e:
        return "", str(e)


@router.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    language: str = Form("en"),
    user_id: str = Form("anonymous"),
):
    file_bytes = await file.read()
    content, error = extract_text(file_bytes, file.filename, file.content_type)

    if error:
        raise HTTPException(status_code=400, detail=error)
    if not content or len(content.strip()) < 50:
        raise HTTPException(status_code=400, detail="File too short or unreadable")

    analysis = analyze_legal_document(content, file.filename, language)

    # Store document context in the user's conversation memory
    # so follow-up questions in chat know about this document
    try:
        from routers.chat import get_context
        ctx = get_context(user_id)
        ctx.add_message(
            "user",
            f"Please analyze this legal document: {file.filename}\n\nContent preview: {content[:500]}",
            "English"
        )
        ctx.add_message(
            "assistant",
            f"I have analyzed the document '{file.filename}'. Here is my analysis:\n\n{analysis[:600]}",
            "English"
        )
    except Exception as e:
        print(f"Context update skipped: {e}")

    # Build suggestions from document content
    suggestions = None
    try:
        from utils.suggestions import build_suggestions
        suggestions = build_suggestions(
            user_query=content[:500],
            ai_response=analysis,
            client=None,
            models=[]
        )
    except Exception:
        pass

    return {
        "filename": file.filename,
        "char_count": len(content),
        "analysis": analysis,
        "language": language,
        "suggestions": suggestions,
    }


class FIRRequest(BaseModel):
    user_data: dict
    proof_images: list = []   # base64 encoded images


@router.post("/fir")
async def generate_fir(req: FIRRequest):
    try:
        from utils.fir_generator import generate_fir_document
        pdf_bytes = generate_fir_document(req.user_data, req.proof_images or [])
        name = req.user_data.get("full_name", "Complainant").replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="FIR_{name}.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ReportRequest(BaseModel):
    user_data: dict
    intent_label: str = "Legal Consultation"


@router.post("/report")
async def generate_report(req: ReportRequest):
    try:
        legal_advice = generate_legal_advice_for_report(req.user_data, req.intent_label)
        from utils.pdf_generator import generate_comprehensive_report
        pdf_bytes = generate_comprehensive_report(
            req.user_data,
            legal_advice,
            req.intent_label,
            helplines=["Police: 100", "Women Helpline: 1091", "Legal Aid: 1800-110-370"],
        )
        name = req.user_data.get("full_name", "User").replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="Legal_Report_{name}.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── RTI Application Generator ─────────────────────────────────────────────────
class RTIRequest(BaseModel):
    applicant_name: str
    address: str
    city: str
    state: str
    pincode: str
    phone: str
    email: str = ""
    department: str
    information_sought: str
    preferred_format: str = "Certified copies of documents"
    bpl_card: bool = False
    date: str = ""


@router.post("/rti")
async def generate_rti(req: RTIRequest):
    """Generate RTI application PDF."""
    try:
        from utils.rti_generator import generate_rti_application
        data = req.dict()
        if not data["date"]:
            from datetime import datetime
            data["date"] = datetime.now().strftime("%d/%m/%Y")
        pdf_bytes = generate_rti_application(data)
        name = req.applicant_name.replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="RTI_{name}.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Legal Templates ───────────────────────────────────────────────────────────
@router.get("/templates")
async def list_templates():
    return {
        "templates": [
            {"id": "legal_notice",      "icon": "📨", "title": "Legal Notice",        "desc": "Send formal notice before legal action"},
            {"id": "court_petition",    "icon": "🏛️", "title": "Court Petition",      "desc": "File a petition in civil/criminal court"},
            {"id": "affidavit",         "icon": "📜", "title": "Affidavit",            "desc": "Sworn statement for court or government use"},
            {"id": "rental_agreement",  "icon": "🏠", "title": "Rental Agreement",    "desc": "Formal landlord-tenant rental contract"},
            {"id": "sale_agreement",    "icon": "🤝", "title": "Sale Agreement",       "desc": "Property or goods sale agreement"},
            {"id": "employment_offer",  "icon": "💼", "title": "Employment Offer Letter", "desc": "Formal job offer letter"},
            {"id": "fir_draft",         "icon": "🚨", "title": "FIR Draft (Form 24.1)",  "desc": "Official police FIR format — Section 154 CrPC / Section 173 BNSS"},
        ]
    }


class TemplateRequest(BaseModel):
    template_id: str
    data: dict


@router.post("/templates/generate")
async def generate_template(req: TemplateRequest):
    try:
        from utils.legal_templates import (
            generate_legal_notice, generate_legal_petition,
            generate_affidavit
        )
        from utils.template_extras import (
            generate_rental_agreement, generate_sale_agreement,
            generate_employment_offer
        )

        gen_map = {
            "legal_notice":     generate_legal_notice,
            "court_petition":   generate_legal_petition,
            "affidavit":        generate_affidavit,
            "rental_agreement": generate_rental_agreement,
            "sale_agreement":   generate_sale_agreement,
            "employment_offer": generate_employment_offer,
            "fir_draft":        lambda d: __import__("utils.fir_generator",
                                    fromlist=["generate_fir_document"]).generate_fir_document(d),
        }

        fn = gen_map.get(req.template_id)
        if not fn:
            raise HTTPException(status_code=404, detail="Template not found")

        pdf_bytes = fn(req.data)
        if not pdf_bytes:
            raise HTTPException(status_code=500, detail="PDF generation returned empty")

        filename = req.template_id.replace("_", "-") + ".pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
