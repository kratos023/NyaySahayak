# backend/utils/suggestions.py
"""
Contextual suggestion chips for Nyay-Sahayak.
Cases are matched by extracting actual IPC/BNS/CrPC sections from the AI response
— much more relevant than broad topic keyword matching.
"""
import re

# ── Section-to-case mapping (the key insight) ─────────────────────────────────
# Cases keyed by the exact section numbers Gemini mentions in its reply
SECTION_CASES = {
    # IPC / BNS domestic violence & cruelty
    "498": ["Arnesh Kumar v. State of Bihar (2014) — SC guidelines on arrest under 498A",
            "Sushil Kumar Sharma v. Union of India (2005) — Misuse of 498A, bail rights"],
    "498a": ["Arnesh Kumar v. State of Bihar (2014) — SC guidelines on arrest under 498A",
             "Rajesh Sharma v. State of UP (2017) — Family welfare committee before 498A arrest"],
    "304b": ["Kamesh Panjiyar v. State of Bihar (2005) — Dowry death, burden of proof shifts to accused",
             "Kans Raj v. State of Punjab (2000) — Dowry death conviction guidelines"],
    "dowry": ["Kamesh Panjiyar v. State of Bihar (2005) — Dowry death, burden of proof",
              "Pawan Kumar v. State of Haryana (1998) — Dowry demand harassment"],
    # Domestic Violence Act
    "dv act": ["S.R. Batra v. Taruna Batra (2006) — Wife's right to stay in matrimonial home",
               "Indra Sarma v. V.K.V. Sarma (2013) — Live-in partners covered under DV Act",
               "Hiral P. Harsora v. Kusum Narottamdas Harsora (2016) — Who can be respondent under DV Act"],
    "domestic violence": ["S.R. Batra v. Taruna Batra (2006) — Wife's right to matrimonial home",
                          "Indra Sarma v. V.K.V. Sarma (2013) — Live-in relationships under DV Act"],
    # Divorce & matrimonial
    "13": ["Naveen Kohli v. Neelu Kohli (2006) — Irretrievable breakdown as valid divorce ground",
           "K. Srinivas Rao v. D.A. Deepa (2013) — Mental cruelty sufficient ground for divorce"],
    "divorce": ["Naveen Kohli v. Neelu Kohli (2006) — Irretrievable breakdown as divorce ground",
                "Savitaben Somabhai Bhatiya v. State of Gujarat (2005) — Second wife's rights"],
    "maintenance": ["Danial Latifi v. Union of India (2001) — Muslim women's right to maintenance",
                    "Rajnesh v. Neha (2020) — Supreme Court guidelines on interim maintenance",
                    "Bhuwan Mohan Singh v. Meena (2014) — Maintenance cannot be waived in settlement"],
    "125": ["Rajnesh v. Neha (2020) — Comprehensive guidelines on maintenance under 125 CrPC",
            "Bhuwan Mohan Singh v. Meena (2014) — Maintenance rights of deserted wife"],
    "custody": ["Gaurav Nagpal v. Sumedha Nagpal (2009) — Child's welfare is paramount in custody",
                "Roxann Sharma v. Arun Sharma (2015) — Interim custody and child's best interest"],
    # Property & land
    "property": ["Vineeta Sharma v. Rakesh Sharma (2020) — Daughters equal coparceners in Hindu property",
                 "Suraj Lamp v. State of Haryana (2011) — Sale through GPA declared illegal"],
    "coparcenary": ["Vineeta Sharma v. Rakesh Sharma (2020) — Daughters equal coparceners, retroactive",
                    "Prakash v. Phulvati (2016) — Earlier ruling on daughters' coparcenary rights"],
    "possession": ["Tulsi Ram v. Bhupali (2007) — Adverse possession of property",
                   "Karnataka Board of Wakf v. Government of India (2004) — Adverse possession"],
    # Consumer
    "consumer": ["Lucknow Development Authority v. M.K. Gupta (1994) — Deficiency in housing service",
                 "Spring Meadows Hospital v. Harjol Ahluwalia (1998) — Medical negligence as deficiency",
                 "Emaar MGF Land v. Aftab Singh (2019) — Real estate builder liable to consumer forum"],
    "deficiency": ["Lucknow Development Authority v. M.K. Gupta (1994) — Deficiency in service",
                   "Indian Medical Association v. V.P. Shantha (1995) — Doctors covered under Consumer Act"],
    # RTI
    "rti": ["CBSE v. Aditya Bandopadhyay (2011) — RTI applies to answer sheets",
            "Girish Ramchandra Deshpande v. CIC (2012) — RTI and personal information limits"],
    "information": ["Girish Ramchandra Deshpande v. CIC (2012) — Personal information under RTI",
                    "Bihar Public Service Commission v. Saiyed Hussain Abbas Rizwi (2012) — RTI and exams"],
    # Labour
    "labour": ["Workmen v. Meenakshi Mills (1992) — Retrenchment compensation rights",
               "Bangalore Water Supply v. A. Rajappa (1978) — What constitutes an industry"],
    "retrenchment": ["Workmen v. Meenakshi Mills (1992) — Retrenchment compensation rights",
                     "Olga Tellis v. Bombay Municipal Corporation (1985) — Right to livelihood"],
    "maternity": ["Municipal Corporation of Delhi v. Female Workers (2000) — Maternity benefits for all",
                  "Air India v. Nargesh Mirza (1981) — Discriminatory service conditions struck down"],
    # Criminal & arrest
    "fir": ["Lalita Kumari v. Govt. of UP (2013) — Mandatory FIR registration for cognizable offences",
            "Arnesh Kumar v. State of Bihar (2014) — Arrest cannot be made mechanically"],
    "arrest": ["D.K. Basu v. State of West Bengal (1997) — Rights of arrested persons, landmark",
               "Arnesh Kumar v. State of Bihar (2014) — Guidelines for arrest in 498A cases",
               "Joginder Kumar v. State of UP (1994) — Police cannot arrest without reasons"],
    "bail": ["Sanjay Chandra v. CBI (2011) — Bail is rule, jail is exception",
             "Nikesh Tarachand Shah v. Union of India (2017) — Bail conditions must be reasonable"],
    "section 307": ["State of MP v. Kashiram (2009) — Attempt to murder, conviction guidelines"],
    "section 376": ["State of Punjab v. Gurmit Singh (1996) — In-camera trial for rape victims",
                    "Delhi Domestic Working Women's Forum v. UOI (1995) — Rape victim support"],
    # Sexual harassment
    "vishaka": ["Vishaka v. State of Rajasthan (1997) — Sexual harassment at workplace guidelines",
                "Apparel Export Promotion Council v. A.K. Chopra (1999) — Vishaka guidelines applied"],
    "sexual harassment": ["Vishaka v. State of Rajasthan (1997) — Sexual harassment at workplace",
                          "Medha Kotwal Lele v. Union of India (2012) — Vishaka compliance mandatory"],
    "pocso": ["Sakshi v. Union of India (2004) — Child victims, in-camera trial",
              "Bachpan Bachao Andolan v. UOI (2011) — Child trafficking, POCSO guidelines"],
    # Cyber
    "cyber": ["Shreya Singhal v. Union of India (2015) — Section 66A struck down",
              "State of Tamil Nadu v. Suhas Katti (2004) — First cyber crime conviction in India"],
    "66a": ["Shreya Singhal v. Union of India (2015) — Section 66A of IT Act unconstitutional"],
    # Constitutional / fundamental rights
    "article 21": ["Maneka Gandhi v. Union of India (1978) — Right to life includes right to livelihood",
                   "Francis Coralie Mullin v. Administrator (1981) — Right to life, dignity"],
    "right to life": ["Maneka Gandhi v. Union of India (1978) — Expanded scope of Article 21",
                      "Olga Tellis v. Bombay Municipal Corporation (1985) — Livelihood as right to life"],
    "fundamental right": ["Maneka Gandhi v. Union of India (1978) — Article 21 expansive interpretation",
                          "Kesavananda Bharati v. State of Kerala (1973) — Basic structure doctrine"],
}

# ── Topic keywords → helplines ────────────────────────────────────────────────
HELPLINE_MAP = {
    "domestic_violence": [("🆘 Women Helpline", "181"), ("👮 Police Emergency", "100"),
                          ("📞 NCW Helpline", "7827-170-170"), ("🏠 One Stop Centre", "181")],
    "sexual_assault":    [("🆘 Women Helpline", "181"), ("👮 Police Emergency", "100"),
                          ("📞 iCall", "9152987821")],
    "child_abuse":       [("👶 Childline India", "1098"), ("👮 Police Emergency", "100"),
                          ("📞 NCPCR", "1800-121-2830")],
    "mental_health":     [("🧠 iCall", "9152987821"), ("💛 Vandrevala Foundation", "1860-2662-345"),
                          ("📞 NIMHANS", "080-46110007")],
    "legal_aid":         [("⚖️ NALSA (Free Legal Aid)", "1800-110-370"),
                          ("📞 Tele-Law", "1800-120-1075")],
    "consumer":          [("📞 Consumer Helpline", "1800-11-4000")],
    "labour":            [("👷 Labour Helpline", "1800-11-1019"), ("📞 EPFO", "1800-118-005")],
    "cyber_crime":       [("💻 Cyber Crime Portal", "cybercrime.gov.in"), ("📞 Cyber Helpline", "1930")],
}

TOPIC_KEYWORDS = {
    "domestic_violence": ["beat", "hit", "abuse", "domestic", "husband", "wife", "assault",
                          "violence", "slap", "torture", "498", "dowry", "dv act"],
    "sexual_assault":    ["rape", "sexual", "molest", "harass", "pocso", "stalking", "eve teasing"],
    "child_abuse":       ["child", "minor", "school", "juvenile", "kidnap", "trafficking"],
    "divorce":           ["divorce", "separation", "alimony", "maintenance", "custody", "matrimonial"],
    "property":          ["property", "land", "flat", "registry", "inheritance", "will", "possession", "tenant"],
    "consumer":          ["consumer", "product", "defect", "refund", "complaint", "fraud", "cheating", "scam"],
    "labour":            ["salary", "fired", "dismiss", "pf", "esic", "maternity", "leave", "employer", "worker"],
    "cyber_crime":       ["cyber", "online fraud", "hacked", "phishing", "blackmail", "social media", "fake"],
    "mental_health":     ["suicide", "depress", "anxiety", "mental", "self harm"],
    "legal_aid":         ["lawyer", "advocate", "court", "judge", "bail", "fir", "police", "arrest"],
}

FIR_TOPICS = {"domestic_violence", "sexual_assault", "child_abuse", "cyber_crime"}


def detect_topics(text: str) -> list:
    text_lower = text.lower()
    return [t for t, kws in TOPIC_KEYWORDS.items() if any(k in text_lower for k in kws)]


def get_helplines_for_topics(topics: list) -> list:
    seen, lines = set(), []
    for t in topics:
        for entry in HELPLINE_MAP.get(t, HELPLINE_MAP["legal_aid"]):
            if entry[0] not in seen:
                seen.add(entry[0]); lines.append(entry)
    return (lines or HELPLINE_MAP["legal_aid"])[:4]


def extract_cases_from_response(ai_response: str) -> list:
    """
    Smart extraction: scan the AI reply for section numbers and legal keywords,
    return cases specifically relevant to what was actually discussed.
    """
    text_lower = ai_response.lower()
    matched_cases = []
    seen = set()

    # Check each key in SECTION_CASES against the AI response
    for key, cases in SECTION_CASES.items():
        if key in text_lower:
            for case in cases:
                if case not in seen:
                    seen.add(case)
                    matched_cases.append(case)

    # Also pull section numbers like "Section 498A", "Section 307", "Article 21"
    section_nums = re.findall(
        r'(?:section|sec\.?|ipc|bns|crpc|article)\s*(\d+[a-zA-Z]*)',
        text_lower
    )
    for num in section_nums:
        key = f"section {num}"
        if key in SECTION_CASES:
            for case in SECTION_CASES[key]:
                if case not in seen:
                    seen.add(case); matched_cases.append(case)

    # Deduplicate and return top 3
    return matched_cases[:3]


def generate_followup_questions(user_query: str, ai_response: str, client, models: list) -> list:
    """Generate 4 smart follow-up questions. Falls back to topic-based defaults."""
    if client and models:
        prompt = f"""You are a legal assistant helping an Indian user.

User's query: "{user_query[:300]}"
AI response summary: "{ai_response[:400]}"

Generate exactly 4 short follow-up questions (under 10 words each) the user might ask next.
Practical, specific, simple English. Return ONLY a JSON array of 4 strings, no markdown.
Example: ["How do I file an FIR?", "What evidence should I keep?", "Can I get a restraining order?", "What is the punishment for this?"]"""

        import json
        for model_name in models:
            try:
                from google.genai import types as genai_types
                response = client.models.generate_content(
                    model=model_name, contents=prompt,
                    config=genai_types.GenerateContentConfig(temperature=0.5, max_output_tokens=200)
                )
                if response and response.text:
                    text = re.sub(r'```json|```', '', response.text).strip()
                    questions = json.loads(text)
                    if isinstance(questions, list) and len(questions) >= 2:
                        return [q for q in questions if isinstance(q, str)][:4]
            except Exception:
                continue

    # Fallback based on topics
    return [
        "What evidence should I collect?",
        "How do I file a police complaint?",
        "Can I get free legal aid?",
        "What are the next steps I should take?",
    ]


def build_suggestions(user_query: str, ai_response: str, client=None, models=None) -> dict:
    """Build complete suggestions payload."""
    # Detect topics from BOTH query and response for better coverage
    topics = list(set(detect_topics(user_query) + detect_topics(ai_response[:500])))
    helplines = get_helplines_for_topics(topics)

    # Smart case extraction from actual AI response content
    cases = extract_cases_from_response(ai_response)

    followups = generate_followup_questions(
        user_query, ai_response, client, models or []
    )

    return {
        "topics":      topics,
        "helplines":   helplines,
        "cases":       cases,
        "followups":   followups,
        "show_fir":    bool(set(topics) & FIR_TOPICS),
        "show_report": len(topics) > 0,
    }
