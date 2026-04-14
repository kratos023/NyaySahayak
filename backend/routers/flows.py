# backend/routers/flows.py
"""
Guided Legal Flows — step-by-step wizards for common situations.
Each flow collects answers progressively and generates a personalized action plan.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

router = APIRouter(prefix="/flows", tags=["flows"])

# ── Flow definitions ──────────────────────────────────────────────────────────
FLOWS = {
    "unpaid_salary": {
        "id":    "unpaid_salary",
        "icon":  "💰",
        "title": "Employer Not Paying Salary",
        "desc":  "Step-by-step guide to recover unpaid wages",
        "color": "#1a2e1a",
        "accent": "#22c55e",
        "steps": [
            {"id": "duration",    "question": "How many months of salary is unpaid?",
             "type": "options", "options": ["1 month", "2–3 months", "4–6 months", "More than 6 months"]},
            {"id": "employment",  "question": "What type of employment are you in?",
             "type": "options", "options": ["Private company", "Factory/manufacturing", "Government contractor", "Domestic worker", "Gig/freelance"]},
            {"id": "amount",      "question": "Approximate amount owed (₹)?",
             "type": "options", "options": ["Under ₹10,000", "₹10,000–₹50,000", "₹50,000–₹1 lakh", "Over ₹1 lakh"]},
            {"id": "notice",      "question": "Have you sent a written demand to your employer?",
             "type": "options", "options": ["Yes, in writing", "Yes, verbally only", "No"]},
            {"id": "documents",   "question": "What proof do you have?",
             "type": "multi",    "options": ["Appointment letter", "Salary slips", "Bank statements", "WhatsApp/email messages", "Witness"]},
        ],
    },
    "domestic_violence": {
        "id":    "domestic_violence",
        "icon":  "🛡️",
        "title": "Domestic Violence / Abuse",
        "desc":  "Immediate steps and legal options for safety",
        "color": "#2d0f1a",
        "accent": "#f43f5e",
        "steps": [
            {"id": "safety",      "question": "Are you currently in immediate danger?",
             "type": "options", "options": ["Yes, right now", "No, but I am scared", "I am currently safe"]},
            {"id": "abuse_type",  "question": "What kind of abuse are you facing?",
             "type": "multi",    "options": ["Physical violence", "Mental/emotional", "Financial control", "Sexual abuse", "Threats"]},
            {"id": "abuser",      "question": "Who is the abuser?",
             "type": "options", "options": ["Husband/partner", "In-laws", "Parent", "Other family member"]},
            {"id": "children",    "question": "Are there children involved?",
             "type": "options", "options": ["Yes, mine", "Yes, shared", "No"]},
            {"id": "prior_action","question": "Have you taken any action so far?",
             "type": "options", "options": ["Filed police complaint", "Approached court", "Spoke to family", "Nothing yet"]},
        ],
    },
    "property_dispute": {
        "id":    "property_dispute",
        "icon":  "🏠",
        "title": "Property / Land Dispute",
        "desc":  "Resolve property conflicts and protect your ownership",
        "color": "#1a1f0f",
        "accent": "#84cc16",
        "steps": [
            {"id": "type",        "question": "What kind of property dispute?",
             "type": "options", "options": ["Family inheritance", "Landlord-tenant", "Encroachment", "Fraud/forgery", "Joint ownership dispute"]},
            {"id": "property",    "question": "What type of property?",
             "type": "options", "options": ["Agricultural land", "House/flat", "Commercial", "Plot/vacant land"]},
            {"id": "documents",   "question": "Do you have ownership documents?",
             "type": "options", "options": ["Yes, all registered", "Partial documents", "Oral agreement only", "No documents"]},
            {"id": "dispute_age", "question": "How long has this dispute been going on?",
             "type": "options", "options": ["Just started", "Less than 1 year", "1–5 years", "More than 5 years"]},
            {"id": "opponent",    "question": "Who is the other party?",
             "type": "options", "options": ["Family member", "Neighbour", "Builder/developer", "Government authority", "Tenant"]},
        ],
    },
    "consumer_complaint": {
        "id":    "consumer_complaint",
        "icon":  "🛒",
        "title": "Consumer Complaint",
        "desc":  "Get refund, replacement or compensation",
        "color": "#0f1a2d",
        "accent": "#60a5fa",
        "steps": [
            {"id": "complaint_type", "question": "What is your complaint about?",
             "type": "options", "options": ["Product defect", "Service deficiency", "Fake/counterfeit product", "Online shopping fraud", "Real estate builder", "Medical negligence", "Bank/insurance"]},
            {"id": "amount",         "question": "Value of your claim (approx)?",
             "type": "options", "options": ["Under ₹50,000", "₹50,000–₹20 lakh", "₹20 lakh–₹1 crore", "Over ₹1 crore"]},
            {"id": "time_elapsed",   "question": "When did the issue occur?",
             "type": "options", "options": ["Within 30 days", "1–6 months ago", "6–24 months ago", "More than 2 years ago"]},
            {"id": "contacted",      "question": "Have you contacted the company?",
             "type": "options", "options": ["Yes, no resolution", "Yes, they ignored me", "No"]},
            {"id": "evidence",       "question": "What evidence do you have?",
             "type": "multi",        "options": ["Bill/receipt", "Emails/messages", "Photos/videos", "Medical reports", "Witness"]},
        ],
    },
    "fir_refusal": {
        "id":    "fir_refusal",
        "icon":  "👮",
        "title": "Police Refusing to File FIR",
        "desc":  "What to do when police won't register your complaint",
        "color": "#1a1018",
        "accent": "#c084fc",
        "steps": [
            {"id": "offence",    "question": "What crime are you reporting?",
             "type": "options", "options": ["Physical assault", "Theft/robbery", "Harassment/stalking", "Domestic violence", "Fraud/cheating", "Other"]},
            {"id": "attempts",   "question": "How many times have you approached the police?",
             "type": "options", "options": ["Once", "2–3 times", "More than 3 times"]},
            {"id": "reason",     "question": "What reason did police give for refusing?",
             "type": "options", "options": ["Civil matter", "No jurisdiction", "No evidence", "No clear reason", "They are ignoring me"]},
            {"id": "written",    "question": "Did you give a written complaint to the police?",
             "type": "options", "options": ["Yes, with acknowledgment", "Yes, no acknowledgment", "Only verbal"]},
        ],
    },
    "cyber_fraud": {
        "id":    "cyber_fraud",
        "icon":  "💻",
        "title": "Cyber Crime / Online Fraud",
        "desc":  "Report fraud and recover money",
        "color": "#0a1a2d",
        "accent": "#06b6d4",
        "steps": [
            {"id": "fraud_type", "question": "What happened?",
             "type": "options", "options": ["UPI/bank fraud", "OTP scam", "Fake job offer", "Online shopping fraud", "Sextortion/blackmail", "Identity theft", "Hacked account"]},
            {"id": "amount",     "question": "How much money was lost?",
             "type": "options", "options": ["Nothing (data stolen)", "Under ₹10,000", "₹10,000–₹1 lakh", "Over ₹1 lakh"]},
            {"id": "time",       "question": "When did this happen?",
             "type": "options", "options": ["Today", "Within 3 days", "Within a week", "More than a week ago"]},
            {"id": "reported",   "question": "Have you reported it?",
             "type": "options", "options": ["Reported to bank immediately", "Reported to police", "Filed on cybercrime.gov.in", "Not yet reported"]},
            {"id": "evidence",   "question": "What evidence do you have?",
             "type": "multi",    "options": ["Transaction ID/UTR", "Screenshots", "Caller phone number", "Email/WhatsApp messages", "Bank statement"]},
        ],
    },
}


class FlowRequest(BaseModel):
    flow_id: str
    answers: dict          # {step_id: answer}
    language: str = "en"
    user_id: str = "anonymous"


@router.get("/list")
async def list_flows():
    return {
        "flows": [
            {"id": f["id"], "icon": f["icon"], "title": f["title"],
             "desc": f["desc"], "color": f["color"], "accent": f["accent"],
             "step_count": len(f["steps"])}
            for f in FLOWS.values()
        ]
    }


@router.get("/{flow_id}")
async def get_flow(flow_id: str):
    flow = FLOWS.get(flow_id)
    if not flow:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


@router.post("/generate")
async def generate_action_plan(req: FlowRequest):
    """
    Given completed flow answers, generate a personalized action plan using Gemini.
    """
    flow = FLOWS.get(req.flow_id)
    if not flow:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Flow not found")

    from utils.ai_client import client, GEMINI_AVAILABLE, GEMINI_MODELS
    from utils.ai_client import call_translation_api

    # Build context from answers
    qa_lines = []
    for step in flow["steps"]:
        answer = req.answers.get(step["id"])
        if answer:
            if isinstance(answer, list):
                answer = ", ".join(answer)
            qa_lines.append(f"- {step['question']}: **{answer}**")

    answers_text = "\n".join(qa_lines)

    lang_name_map = {
        "en": "English", "hi": "Hindi", "bn": "Bengali", "te": "Telugu",
        "mr": "Marathi", "ta": "Tamil", "gu": "Gujarati", "kn": "Kannada",
        "ml": "Malayalam", "pa": "Punjabi", "or": "Odia",
    }
    lang_name = lang_name_map.get(req.language, "English")

    prompt = f"""You are an expert Indian legal advisor. A person has described their situation through a guided questionnaire. 
Generate a PERSONALIZED, ACTIONABLE legal guidance plan in {lang_name}.

Situation: {flow['title']}

Their specific answers:
{answers_text}

Generate a comprehensive action plan in {lang_name} with these sections using markdown:

## 🎯 Your Situation Summary
[2-3 sentences summarizing their specific situation based on answers]

## ⚡ Immediate Steps (Do These Today)
[3-4 urgent actions numbered, specific to their answers]

## ⚖️ Your Legal Rights
[Specific rights applicable to their situation, with relevant Indian law sections]

## 📋 Step-by-Step Process
[Detailed numbered steps with timeline estimates]

## 📁 Documents You Need
[Specific documents to gather based on their situation]

## 📞 Who to Contact
[Specific authorities, helplines, and contacts relevant to their case]

## ⚠️ Important Warnings
[Deadlines, things to avoid, common mistakes]

CRITICAL: 
- Be SPECIFIC to their answers, not generic
- Include exact section numbers (IPC, CrPC, relevant Acts)
- Use simple language, no jargon
- Respond entirely in {lang_name}"""

    if not GEMINI_AVAILABLE or client is None:
        return {"plan": "⚠️ AI service unavailable. Please call NALSA: 1800-110-370 for free legal help."}

    from google.genai import types as genai_types
    for model in GEMINI_MODELS:
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=genai_types.GenerateContentConfig(temperature=0.6, max_output_tokens=2500)
            )
            if resp and resp.text:
                # Store in conversation context for follow-up questions
                try:
                    from routers.chat import get_context
                    ctx = get_context(req.user_id)
                    ctx.add_message("user", f"I need help with: {flow['title']}. My situation: {answers_text[:400]}", "English")
                    ctx.add_message("assistant", resp.text[:600], lang_name)
                except Exception:
                    pass
                return {"plan": resp.text, "flow_title": flow["title"]}
        except Exception as e:
            print(f"Flow generation model {model} failed: {e}")
            continue

    return {"plan": "⚠️ Could not generate plan. Please call NALSA: 1800-110-370"}
