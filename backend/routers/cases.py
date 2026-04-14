# backend/routers/cases.py
"""
Case Status Tracker using eCourts public portal.
eCourts doesn't have a clean REST API — we provide:
1. Direct deep-link URLs to eCourts case status page
2. State/district/court hierarchy for navigation
3. Case number format guide per court type
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from urllib.parse import quote_plus
import requests, re

router = APIRouter(prefix="/cases", tags=["cases"])

# ── eCourts State list (from their portal) ─────────────────────────────────────
STATES = [
    {"code": "1",  "name": "Andhra Pradesh"},
    {"code": "2",  "name": "Arunachal Pradesh"},
    {"code": "3",  "name": "Assam"},
    {"code": "4",  "name": "Bihar"},
    {"code": "5",  "name": "Chhattisgarh"},
    {"code": "6",  "name": "Delhi"},
    {"code": "7",  "name": "Goa"},
    {"code": "8",  "name": "Gujarat"},
    {"code": "9",  "name": "Haryana"},
    {"code": "10", "name": "Himachal Pradesh"},
    {"code": "11", "name": "Jharkhand"},
    {"code": "12", "name": "Karnataka"},
    {"code": "13", "name": "Kerala"},
    {"code": "14", "name": "Madhya Pradesh"},
    {"code": "15", "name": "Maharashtra"},
    {"code": "16", "name": "Manipur"},
    {"code": "17", "name": "Meghalaya"},
    {"code": "18", "name": "Mizoram"},
    {"code": "19", "name": "Nagaland"},
    {"code": "20", "name": "Odisha"},
    {"code": "21", "name": "Punjab"},
    {"code": "22", "name": "Rajasthan"},
    {"code": "23", "name": "Sikkim"},
    {"code": "24", "name": "Tamil Nadu"},
    {"code": "25", "name": "Telangana"},
    {"code": "26", "name": "Tripura"},
    {"code": "27", "name": "Uttar Pradesh"},
    {"code": "28", "name": "Uttarakhand"},
    {"code": "29", "name": "West Bengal"},
    {"code": "30", "name": "Jammu & Kashmir"},
    {"code": "31", "name": "Ladakh"},
    {"code": "32", "name": "Puducherry"},
]

CASE_TYPES = [
    {"id": "CNR",    "label": "CNR Number",        "desc": "Case Number Record — unique 16-digit code on every court document", "example": "DLCT010123452024"},
    {"id": "CASE",   "label": "Case Number",        "desc": "Case type + number + year (e.g. CS 123/2023)", "example": "CS/123/2023"},
    {"id": "FIR",    "label": "FIR Number",         "desc": "FIR number + police station + year", "example": "FIR No. 45/2023"},
    {"id": "PARTY",  "label": "Party Name",         "desc": "Search by petitioner or respondent name", "example": "Rajesh Kumar"},
    {"id": "ADVOCATE","label": "Advocate Name",     "desc": "Search all cases of a specific advocate", "example": "Adv. Sharma"},
]

HIGH_COURTS = [
    {"name": "Supreme Court of India",          "url": "https://main.sci.gov.in/case-status"},
    {"name": "Delhi High Court",                "url": "https://delhihighcourt.nic.in/"},
    {"name": "Bombay High Court",               "url": "https://bombayhighcourt.nic.in/"},
    {"name": "Madras High Court",               "url": "https://hcmadras.tn.nic.in/"},
    {"name": "Calcutta High Court",             "url": "https://calcuttahighcourt.gov.in/"},
    {"name": "Karnataka High Court",            "url": "https://hck.kar.nic.in/"},
    {"name": "Allahabad High Court",            "url": "https://allahabadhighcourt.in/"},
    {"name": "Gujarat High Court",              "url": "https://gujarathighcourt.nic.in/"},
    {"name": "Rajasthan High Court",            "url": "https://hcraj.nic.in/"},
    {"name": "Punjab & Haryana High Court",     "url": "https://highcourtchd.gov.in/"},
    {"name": "Telangana High Court",            "url": "https://hct.gov.in/"},
    {"name": "Kerala High Court",               "url": "https://highcourt.kerala.gov.in/"},
]


class CaseSearchRequest(BaseModel):
    search_type: str      # CNR, CASE, FIR, PARTY, ADVOCATE
    query: str            # the actual search value
    state_code: str = "6" # default Delhi
    court_type: str = "district"  # district or high


@router.get("/states")
async def get_states():
    return {"states": STATES}


@router.get("/case-types")
async def get_case_types():
    return {"case_types": CASE_TYPES, "high_courts": HIGH_COURTS}


@router.post("/search")
async def search_case(req: CaseSearchRequest):
    """
    Generate eCourts search links for case tracking.
    eCourts has CAPTCHA on their API so we provide deep-links + instructions.
    """
    query_enc = quote_plus(req.query.strip())
    state_name = next((s["name"] for s in STATES if s["code"] == req.state_code), "India")

    # Build relevant search links
    links = []

    if req.search_type == "CNR":
        cnr = req.query.strip().upper()
        links = [
            {
                "label": "🔍 Search on eCourts (CNR)",
                "url":   f"https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/getCNRDetails&CNR_NO={cnr}",
                "desc":  "Direct CNR lookup on official eCourts portal",
                "primary": True,
            },
            {
                "label": "📱 eCourts Mobile App",
                "url":   "https://play.google.com/store/apps/details?id=com.nic.ecourts",
                "desc":  "Download eCourts app — enter CNR for instant status",
                "primary": False,
            },
        ]
    elif req.search_type == "PARTY":
        links = [
            {
                "label": f"🔍 Search '{req.query}' on eCourts",
                "url":   f"https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&appFlag=web",
                "desc":  f"Go to eCourts → Case Status → Party Name → enter '{req.query}'",
                "primary": True,
            },
            {
                "label": "🌐 Google — Find Case",
                "url":   f"https://www.google.com/search?q={query_enc}+court+case+status+India+site:services.ecourts.gov.in",
                "desc":  "Search Google for the case on eCourts",
                "primary": False,
            },
        ]
    else:
        links = [
            {
                "label": "🔍 eCourts Case Status",
                "url":   "https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&appFlag=web",
                "desc":  f"Visit eCourts → select {state_name} → enter your case details",
                "primary": True,
            },
        ]

    # High Court links for the state
    hc_links = []
    for hc in HIGH_COURTS:
        if state_name.split()[0].lower() in hc["name"].lower() or \
           (state_name == "Delhi" and "Delhi" in hc["name"]):
            hc_links.append(hc)
            break
    if not hc_links:
        hc_links = [{"name": "Supreme Court of India", "url": "https://main.sci.gov.in/case-status"}]

    # Step by step instructions
    if req.search_type == "CNR":
        steps = [
            "Click the 'Search on eCourts (CNR)' link above",
            f"Enter your CNR number: <strong>{req.query}</strong>",
            "Click 'Search' — case details will appear instantly",
            "You'll see: case status, next hearing date, orders passed",
        ]
    else:
        steps = [
            "Click the eCourts link above",
            f"Select State: <strong>{state_name}</strong>",
            "Select District and Court Complex",
            f"Choose '{req.search_type}' tab, enter: <strong>{req.query}</strong>",
            "Click Go/Search to see case status and next date",
        ]

    # What info you'll see
    info_available = [
        "Current case status (pending/disposed/decided)",
        "Next hearing date and purpose",
        "All orders and judgments passed",
        "History of all dates",
        "Names of petitioner, respondent, and advocates",
        "Court and bench details",
    ]

    return {
        "query":          req.query,
        "search_type":    req.search_type,
        "state":          state_name,
        "links":          links,
        "high_court":     hc_links[0] if hc_links else None,
        "steps":          steps,
        "info_available": info_available,
        "tip":            "📱 The eCourts mobile app (Android/iOS) gives the fastest case status — just enter the CNR number from your court documents.",
    }


@router.get("/what-is-cnr")
async def cnr_info():
    return {
        "title": "What is a CNR Number?",
        "desc":  "Case Number Record — a unique 16-character identifier assigned to every case in Indian courts.",
        "format": "XXYYZZZZZZZZYYYY where XX=state, YY=district, ZZZZZZZZ=case serial, YYYY=year",
        "example": "DLCT010123452024 = Delhi, Civil Court, Case 1234, Year 2024",
        "where_to_find": [
            "First page of any court order or judgment",
            "Cause list displayed outside courtroom",
            "Receipt when filing the case",
            "Vakalatnama (advocate's appointment letter)",
        ],
    }
