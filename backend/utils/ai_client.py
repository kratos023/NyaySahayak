# backend/utils/ai_client.py
# All Gemini + Bhashini API logic — no Streamlit dependency

import os
import re
import time
import base64
import requests
from typing import Optional

# ── Gemini ────────────────────────────────────────────────────────────────────
GEMINI_AVAILABLE = False
client = None

try:
    from google import genai
    from google.genai import types as genai_types

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY and GEMINI_API_KEY.startswith("AIza"):
        client = genai.Client(api_key=GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
        print("✅ Gemini client ready")
except Exception as e:
    print(f"⚠️ Gemini unavailable: {e}")

GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]

# ── Bhashini ──────────────────────────────────────────────────────────────────
INFERENCE_API_KEY = os.getenv("BHASHINI_API_KEY")
API_ENDPOINT = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"

BHASHINI_HEADERS = {
    "Authorization": INFERENCE_API_KEY,
    "Content-Type": "application/json",
}

LANGUAGES = {
    "English":   {"code": "en",  "emoji": "🇺🇸", "name": "English"},
    "Hindi":     {"code": "hi",  "emoji": "🇮🇳", "name": "हिंदी"},
    "Bengali":   {"code": "bn",  "emoji": "🇮🇳", "name": "বাংলা"},
    "Telugu":    {"code": "te",  "emoji": "🇮🇳", "name": "తెలుగు"},
    "Marathi":   {"code": "mr",  "emoji": "🇮🇳", "name": "मराठी"},
    "Tamil":     {"code": "ta",  "emoji": "🇮🇳", "name": "தமிழ்"},
    "Gujarati":  {"code": "gu",  "emoji": "🇮🇳", "name": "ગુજરાતી"},
    "Kannada":   {"code": "kn",  "emoji": "🇮🇳", "name": "ಕನ್ನಡ"},
    "Malayalam": {"code": "ml",  "emoji": "🇮🇳", "name": "മലയാളം"},
    "Punjabi":   {"code": "pa",  "emoji": "🇮🇳", "name": "ਪੰਜਾਬੀ"},
    "Odia":      {"code": "or",  "emoji": "🇮🇳", "name": "ଓଡ଼ିଆ"},
}

EMERGENCY_KEYWORDS = [
    "kill", "murder", "death threat", "suicide", "harm", "violence",
    "beat", "assault", "abuse", "rape", "attack", "danger", "emergency"
]

# ── Language-specific headers ──────────────────────────────────────────────────
LANGUAGE_HEADERS = {
    "English": {
        "summary": "📋 Quick Summary",
        "explanation": "⚖️ Legal Explanation", 
        "action": "🎯 Action Steps",
        "contacts": "📞 Contacts & Resources",
        "notes": "⚠️ Important Notes",
        "disclaimer": "💼 Disclaimer",
        "first": "First",
        "second": "Second", 
        "third": "Third"
    },
    "Hindi": {
        "summary": "📋 त्वरित सारांश",
        "explanation": "⚖️ कानूनी स्पष्टीकरण",
        "action": "🎯 कार्य योजना", 
        "contacts": "📞 संपर्क और संसाधन",
        "notes": "⚠️ महत्वपूर्ण बातें",
        "disclaimer": "💼 अस्वीकरण",
        "first": "पहले",
        "second": "दूसरे",
        "third": "तीसरे"
    },
    "Tamil": {
        "summary": "📋 விரைவு சுருக்கம்",
        "explanation": "⚖️ சட்ட விளக்கம்",
        "action": "🎯 செயல் திட்டம்",
        "contacts": "📞 தொடர்பு மற்றும் வளங்கள்", 
        "notes": "⚠️ முக்கிய குறிப்புகள்",
        "disclaimer": "💼 மறுப்பு",
        "first": "முதலில்",
        "second": "இரண்டாவது",
        "third": "மூன்றாவது"
    },
    "Bengali": {
        "summary": "📋 দ্রুত সারসংক্ষেপ",
        "explanation": "⚖️ আইনি ব্যাখ্যা",
        "action": "🎯 কর্ম পরিকল্পনা",
        "contacts": "📞 যোগাযোগ ও সম্পদ",
        "notes": "⚠️ গুরুত্বপূর্ণ বিষয়",
        "disclaimer": "💼 দাবিত্যাগ",
        "first": "প্রথম",
        "second": "দ্বিতীয়",
        "third": "তৃতীয়"
    },
    "Telugu": {
        "summary": "📋 వేగ సారాంశం",
        "explanation": "⚖️ చట్టపరమైన వివరణ",
        "action": "🎯 చర్యల ప్రణాళిక",
        "contacts": "📞 సంప్రదింపులు మరియు వనరులు",
        "notes": "⚠️ ముఖ్యమైన గమనికలు", 
        "disclaimer": "💼 నిరాకరణ",
        "first": "మొదట",
        "second": "రెండవ",
        "third": "మూడవ"
    },
    "Gujarati": {
        "summary": "📋 ઝડપી સારાંશ",
        "explanation": "⚖️ કાનૂની સમજૂતી",
        "action": "🎯 કાર્ય યોજના",
        "contacts": "📞 સંપર્ક અને સંસાધનો",
        "notes": "⚠️ મહત્વપૂર્ણ નોંધો",
        "disclaimer": "💼 અસ્વીકાર",
        "first": "પ્રથમ",
        "second": "બીજું",
        "third": "ત્રીજું"
    },
    "Marathi": {
        "summary": "📋 जलद सारांश",
        "explanation": "⚖️ कायदेशीर स्पष्टीकरण",
        "action": "🎯 कृती योजना",
        "contacts": "📞 संपर्क आणि संसाधने",
        "notes": "⚠️ महत्वाच्या गोष्टी",
        "disclaimer": "💼 अस्वीकरण",
        "first": "प्रथम",
        "second": "दुसरे",
        "third": "तिसरे"
    },
    "Kannada": {
        "summary": "📋 ತ್ವರಿತ ಸಾರಾಂಶ",
        "explanation": "⚖️ ಕಾನೂನು ವಿವರಣೆ",
        "action": "🎯 ಕ್ರಿಯಾ ಯೋಜನೆ",
        "contacts": "📞 ಸಂಪರ್ಕ ಮತ್ತು ಸಂಪನ್ಮೂಲಗಳು",
        "notes": "⚠️ ಪ್ರಮುಖ ಟಿಪ್ಪಣಿಗಳು",
        "disclaimer": "💼 ಹಕ್ಕುತ್ಯಾಗ",
        "first": "ಮೊದಲು",
        "second": "ಎರಡನೆಯದು",
        "third": "ಮೂರನೆಯದು"
    },
    "Malayalam": {
        "summary": "📋 വേഗത്തിലുള്ള സംഗ്രഹം",
        "explanation": "⚖️ നിയമപരമായ വിശദീകരണം",
        "action": "🎯 പ്രവർത്തന പദ്ധതി",
        "contacts": "📞 ബന്ധപ്പെടാനുള്ള വിവരങ്ങളും വിഭവങ്ങളും",
        "notes": "⚠️ പ്രധാന കുറിപ്പുകൾ",
        "disclaimer": "💼 നിരാകരണം",
        "first": "ആദ്യം",
        "second": "രണ്ടാമത്",
        "third": "മൂന്നാമത്"
    },
    "Punjabi": {
        "summary": "📋 ਤੁਰੰਤ ਸੰਖੇਪ",
        "explanation": "⚖️ ਕਾਨੂੰਨੀ ਵਿਆਖਿਆ",
        "action": "🎯 ਕਾਰਜ ਯੋਜਨਾ",
        "contacts": "📞 ਸੰਪਰਕ ਅਤੇ ਸਾਧਨ",
        "notes": "⚠️ ਮਹੱਤਵਪੂਰਨ ਨੋਟਸ",
        "disclaimer": "💼 ਬੇਦਾਅਵਾ",
        "first": "ਪਹਿਲਾਂ",
        "second": "ਦੂਜਾ",
        "third": "ਤੀਜਾ"
    },
    "Odia": {
        "summary": "📋 ଶୀଘ୍ର ସାରାଂଶ",
        "explanation": "⚖️ ଆଇନଗତ ବ୍ୟାଖ୍ୟା",
        "action": "🎯 କାର୍ଯ୍ୟ ଯୋଜନା",
        "contacts": "📞 ଯୋଗାଯୋଗ ଏବଂ ଉତ୍ସଗୁଡ଼ିକ",
        "notes": "⚠️ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଟିପ୍ପଣୀ",
        "disclaimer": "💼 ଦାବିତ୍ୟାଗ",
        "first": "ପ୍ରଥମେ",
        "second": "ଦ୍ୱିତୀୟ",
        "third": "ତୃତୀୟ"
    }
}

# ── Response formatting ────────────────────────────────────────────────────────
def format_ai_response(text: str) -> str:
    if not text:
        return "No response generated."
    text = re.sub(r'\*\* \* \*', '**', text)
    text = re.sub(r'^\*\s+', '- ', text, flags=re.MULTILINE)
    text = re.sub(r'(Section (\d+[A-Za-z]*))', r'**\1**', text)
    text = re.sub(r'^# ([^\n]+)$', r'## \1', text, flags=re.MULTILINE)
    return text.strip()

# ── Emergency + quota fallbacks ────────────────────────────────────────────────
def get_emergency_response() -> str:
    return """## 🚨 EMERGENCY — IMMEDIATE DANGER

**Call these numbers RIGHT NOW:**

| Helpline | Number |
|----------|--------|
| 🚔 Police Emergency | **100** |
| 👩 Women Helpline | **1091** |
| 🏠 Domestic Violence | **181** |
| 📞 NCW | **7827-170-170** |
| 🆘 All Emergencies | **112** |

### Immediate steps:
1. **Get to a safe place** — neighbour, family, shelter
2. **Call 100** and request immediate assistance
3. **File a Zero FIR** at any police station (no jurisdiction needed)
4. **Contact DLSA** for a free lawyer: 1800-110-370

*You have the right to protection, divorce, maintenance, and custody. Please seek help immediately.*"""

def get_quota_response() -> str:
    return """## ⚠️ AI Service Temporarily Unavailable

Please wait 30 seconds and try again, or use these resources:

- **Free Legal Aid (NALSA):** 1800-110-370
- **Tele-Law:** 1800-120-1075
- **Police:** 100 | **Women:** 1091 | **Domestic Violence:** 181"""

# ── System prompt generator ────────────────────────────────────────────────────
def get_system_prompt_template(lang_name: str) -> str:
    # Get headers for the language, fallback to English
    headers = LANGUAGE_HEADERS.get(lang_name, LANGUAGE_HEADERS["English"])
    
    return f"""You are an expert Indian legal AI assistant. Respond ENTIRELY in {lang_name}. Format responses beautifully using markdown.

**RESPONSE FORMAT (MANDATORY — use exactly these headers with emojis):**

## {headers["summary"]}
[2-3 sentences with immediate answer in {lang_name}]

## {headers["explanation"]}
[Relevant laws with **bold** section references, bullet points — in {lang_name}]

## {headers["action"]}
1. **{headers["first"]}:** [Immediate action in {lang_name}]
2. **{headers["second"]}:** [Next step in {lang_name}]
3. **{headers["third"]}:** [Follow-up in {lang_name}]

## {headers["contacts"]}
[Helplines, portals, legal aid in {lang_name}]

## {headers["notes"]}
[Key warnings, timelines in {lang_name}]

## {headers["disclaimer"]}
*General legal information only. Consult a qualified lawyer for your specific case — in {lang_name}.*

**CRITICAL:** Use ## headers, **bold**, and bullet points (- ) throughout. Never write in plain paragraphs.
**TONE:** Empathetic, professional, clear, action-oriented. For emergencies: helplines first.
**LANGUAGE:** Everything including headers, bullet points, examples must be in {lang_name}."""

# ── Gemini legal query ─────────────────────────────────────────────────────────
def query_legal_ai(question: str, context: str = "", language: str = "en") -> str:
    is_emergency = any(kw in question.lower() for kw in EMERGENCY_KEYWORDS)

    if not GEMINI_AVAILABLE or client is None:
        return get_emergency_response() if is_emergency else get_quota_response()

    # Get the display name for the language code
    lang_name = next(
        (info["name"] for info in LANGUAGES.values() if info["code"] == language),
        "English"
    )
    # Use English name for prompt clarity with non-Latin scripts
    lang_display = next(
        (name for name, info in LANGUAGES.items() if info["code"] == language),
        "English"
    )

    system_prompt = get_system_prompt_template(lang_display)

    full_prompt = f"{system_prompt}\n\n{context}\n{question}" if context else f"{system_prompt}\n\n{question}"

    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=genai_types.GenerateContentConfig(temperature=0.7, max_output_tokens=2000),
            )
            if response and response.text:
                return format_ai_response(response.text)
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                return get_emergency_response() if is_emergency else get_quota_response()
            continue

    return get_emergency_response() if is_emergency else get_quota_response()

# ── Document analysis ──────────────────────────────────────────────────────────
def analyze_legal_document(file_content: str, filename: str, target_language: str = "en") -> str:
    if not GEMINI_AVAILABLE or client is None:
        return "⚠️ AI service not available for document analysis."

    lang_name = next((n for n, info in LANGUAGES.items() if info["code"] == target_language), "English")

    prompt = f"""Analyze this legal document and provide a structured summary IN {lang_name.upper()}.

Filename: {filename}
Content: {file_content[:15000]}

Sections to include (use emojis as shown):
## 📋 Document Overview
## ⚖️ Legal Framework & Applicable Laws
## 🎯 Actionable Recommendations
## ⚠️ Critical Considerations
## 📞 Relevant Contacts & Resources

Important: Respond entirely in {lang_name}. Focus on Indian legal context."""

    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=genai_types.GenerateContentConfig(temperature=0.7, max_output_tokens=2500),
            )
            if response and response.text:
                return format_ai_response(response.text)
        except Exception:
            continue

    return "⚠️ Could not analyze document. Please try again."

# ── Bhashini: ASR ─────────────────────────────────────────────────────────────
def call_asr_api(audio_base64: str, source_lang: str) -> Optional[str]:
    payload = {
        "pipelineTasks": [{
            "taskType": "asr",
            "config": {
                "language": {"sourceLanguage": source_lang},
                "serviceId": "",
                "audioFormat": "wav",
                "samplingRate": 16000,
            }
        }],
        "inputData": {"audio": [{"audioContent": audio_base64}]},
    }
    try:
        r = requests.post(API_ENDPOINT, headers=BHASHINI_HEADERS, json=payload, timeout=30)
        print(f"ASR status: {r.status_code} | response: {r.text[:300]}")
        if r.status_code == 200:
            return r.json()["pipelineResponse"][0]["output"][0]["source"]
    except Exception as e:
        print(f"ASR error: {e}")
    return None

# ── Bhashini: TTS ─────────────────────────────────────────────────────────────
def call_tts_api(text: str, target_lang: str) -> Optional[bytes]:
    payload = {
        "pipelineTasks": [{
            "taskType": "tts",
            "config": {
                "language": {"sourceLanguage": target_lang},
                "serviceId": "",
                "gender": "female",
            }
        }],
        "inputData": {"input": [{"source": text[:500]}]},
    }
    try:
        r = requests.post(API_ENDPOINT, headers=BHASHINI_HEADERS, json=payload, timeout=30)
        print(f"TTS status: {r.status_code} | response: {r.text[:300]}")
        if r.status_code == 200:
            data = r.json()
            audio_b64 = data["pipelineResponse"][0]["audio"][0]["audioContent"]
            if audio_b64:
                return base64.b64decode(audio_b64)
    except Exception as e:
        print(f"TTS error: {e}")
    return None

# ── Bhashini: Translation ─────────────────────────────────────────────────────
def call_translation_api(text: str, source_lang: str, target_lang: str) -> Optional[str]:
    if source_lang == target_lang:
        return text
    payload = {
        "pipelineTasks": [{
            "taskType": "translation",
            "config": {
                "language": {"sourceLanguage": source_lang, "targetLanguage": target_lang},
                "serviceId": "",
            }
        }],
        "inputData": {"input": [{"source": text}]},
    }
    for attempt in range(3):
        try:
            r = requests.post(API_ENDPOINT, headers=BHASHINI_HEADERS, json=payload, timeout=30)
            if r.status_code == 200:
                return r.json()["pipelineResponse"][0]["output"][0]["target"]
            elif r.status_code == 429:
                time.sleep(2 ** attempt)
        except Exception as e:
            print(f"Translation error: {e}")
    return None

# ── Legal advice for report generation ───────────────────────────────────────
def generate_legal_advice_for_report(user_data: dict, intent_label: str) -> str:
    if not GEMINI_AVAILABLE:
        return "Legal advice generation unavailable. Please contact helplines directly."

    prompt = f"""Generate comprehensive legal advice for this case in English:

Case Type: {intent_label}
Name: {user_data.get('full_name', 'User')}, Age: {user_data.get('age', 'Unknown')}
Incident Date: {user_data.get('incident_date', 'Unknown')}
Location: {user_data.get('incident_location', 'Unknown')}
Description: {user_data.get('incident_description', 'No description provided')}

Provide:
1. Applicable Indian laws and sections
2. Step-by-step legal procedure
3. Required documentation
4. Timeline expectations
5. Relevant authority contacts

Format with clear sections and bullet points."""

    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=genai_types.GenerateContentConfig(temperature=0.7, max_output_tokens=2000),
            )
            if response and response.text:
                return response.text
        except Exception:
            continue

    return "Unable to generate advice at this time."
