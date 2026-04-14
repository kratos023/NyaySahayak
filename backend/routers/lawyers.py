# backend/routers/lawyers.py
"""
Vakeel Dhundhna — Find a Lawyer.
Google Maps deep-links for lawyers by specialization + district.
Bar Council contact info + NALSA empanelled lawyer info.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from urllib.parse import quote_plus
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

router = APIRouter(prefix="/lawyers", tags=["lawyers"])

SPECIALIZATIONS = [
    {"id": "criminal",      "icon": "⚖️",  "label": "Criminal Law",           "hindi": "आपराधिक कानून"},
    {"id": "family",        "icon": "👨‍👩‍👧", "label": "Family & Divorce",        "hindi": "परिवार और तलाक"},
    {"id": "property",      "icon": "🏠",  "label": "Property & Real Estate",  "hindi": "संपत्ति"},
    {"id": "consumer",      "icon": "🛒",  "label": "Consumer Law",            "hindi": "उपभोक्ता कानून"},
    {"id": "labour",        "icon": "👷",  "label": "Labour & Employment",     "hindi": "श्रम कानून"},
    {"id": "cyber",         "icon": "💻",  "label": "Cyber Crime",             "hindi": "साइबर अपराध"},
    {"id": "civil",         "icon": "📋",  "label": "Civil Disputes",          "hindi": "दीवानी विवाद"},
    {"id": "women",         "icon": "👩",  "label": "Women's Rights",          "hindi": "महिला अधिकार"},
    {"id": "rti",           "icon": "📄",  "label": "RTI / Government",        "hindi": "आरटीआई"},
    {"id": "immigration",   "icon": "✈️",  "label": "Immigration & Passport",  "hindi": "आव्रजन"},
]

# State Bar Councils with contact info
STATE_BAR_COUNCILS = {
    "Delhi":          {"name": "Bar Council of Delhi",                     "phone": "011-23355778", "website": "http://www.barcouncilofdelhi.org"},
    "Maharashtra":    {"name": "Bar Council of Maharashtra & Goa",         "phone": "022-22618162", "website": ""},
    "Karnataka":      {"name": "Karnataka State Bar Council",              "phone": "080-22867565", "website": ""},
    "Tamil Nadu":     {"name": "Bar Council of Tamil Nadu",                "phone": "044-25384809", "website": ""},
    "Uttar Pradesh":  {"name": "Bar Council of Uttar Pradesh",             "phone": "0532-2440662", "website": ""},
    "West Bengal":    {"name": "Bar Council of West Bengal",               "phone": "033-22487468", "website": ""},
    "Gujarat":        {"name": "Bar Council of Gujarat",                   "phone": "079-27540793", "website": ""},
    "Rajasthan":      {"name": "Bar Council of Rajasthan",                 "phone": "0141-2744533", "website": ""},
    "Telangana":      {"name": "Bar Council of Telangana",                 "phone": "040-23232929", "website": ""},
    "Kerala":         {"name": "Bar Council of Kerala",                    "phone": "0471-2725299", "website": ""},
    "Punjab & Haryana": {"name": "Bar Council of Punjab & Haryana",        "phone": "0172-2740183", "website": ""},
    "Madhya Pradesh": {"name": "Bar Council of Madhya Pradesh",            "phone": "0755-2555870", "website": ""},
}

FREE_LEGAL_AID = {
    "name":    "District Legal Services Authority (DLSA)",
    "desc":    "Free lawyers for those who cannot afford legal fees. Available in every district.",
    "how":     "Visit your District Court and ask for DLSA office, or call NALSA.",
    "eligibility": [
        "Annual income below ₹3 lakh (varies by state)",
        "SC/ST communities",
        "Women and children",
        "Persons with disability",
        "Victims of trafficking, disasters",
        "Industrial workmen",
    ],
    "nalsa_phone":   "1800-110-370",
    "nalsa_website": "nalsa.gov.in",
    "tele_law":      "1800-120-1075",
}


class LawyerSearchRequest(BaseModel):
    location: str
    specialization: str = "criminal"
    language_pref: str = ""


@router.get("/specializations")
async def get_specializations():
    return {"specializations": SPECIALIZATIONS}


@router.post("/search")
async def search_lawyers(req: LawyerSearchRequest):
    """
    Generate Google Maps + JustDial search links for lawyers in the area.
    Also returns Bar Council contact and free legal aid info.
    """
    loc_enc  = quote_plus(req.location)
    spec     = next((s for s in SPECIALIZATIONS if s["id"] == req.specialization), SPECIALIZATIONS[0])
    spec_label = spec["label"]

    # Generate multiple search links
    search_links = [
        {
            "label": f"🗺️ Google Maps — {spec_label} Lawyer",
            "url":   f"https://www.google.com/maps/search/{quote_plus(spec_label + ' advocate lawyer')}+near+{loc_enc}",
            "desc":  "Find lawyers with ratings and reviews near you",
        },
        {
            "label": f"📋 Google Search — {spec_label} Advocates",
            "url":   f"https://www.google.com/search?q={quote_plus(spec_label + ' advocate lawyer ' + req.location)}",
            "desc":  "Search for advocates in your area",
        },
        {
            "label": "🏛️ District Court — Official Lawyers List",
            "url":   f"https://districts.ecourts.gov.in/",
            "desc":  "Official eCourts portal — find advocates registered in your district court",
        },
        {
            "label": "⚖️ Bar Council Enrollment Search",
            "url":   "https://www.barcouncilofindia.org/about/professional-standards/rules-governing-advocates/",
            "desc":  "Verify if a lawyer is properly enrolled with Bar Council of India",
        },
    ]

    # Language-specific lawyer search
    if req.language_pref and req.language_pref != "English":
        search_links.append({
            "label": f"🗣️ {req.language_pref}-speaking Lawyers",
            "url":   f"https://www.google.com/search?q={quote_plus(req.language_pref + ' speaking ' + spec_label + ' advocate ' + req.location)}",
            "desc":  f"Find lawyers who speak {req.language_pref}",
        })

    # State bar council
    state_council = None
    for state_name, council in STATE_BAR_COUNCILS.items():
        if state_name.lower() in req.location.lower():
            state_council = {**council, "state": state_name}
            break

    return {
        "location":     req.location,
        "specialization": spec,
        "search_links": search_links,
        "state_council": state_council,
        "free_legal_aid": FREE_LEGAL_AID,
        "tips": [
            "Always verify a lawyer's Bar Council enrollment number",
            "Get fee agreement in writing before engaging",
            "Free legal aid is available — don't pay if you qualify",
            "For urgent matters, NALSA can arrange emergency legal assistance",
        ],
    }


@router.get("/free-aid")
async def get_free_aid():
    return FREE_LEGAL_AID


@router.get("/bar-councils")
async def get_bar_councils():
    return {"bar_councils": STATE_BAR_COUNCILS}
