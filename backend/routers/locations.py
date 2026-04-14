# backend/routers/locations.py
from fastapi import APIRouter
from pydantic import BaseModel
from urllib.parse import quote_plus

router = APIRouter(prefix="/locations", tags=["locations"])

HELPLINES = [
    {"name": "👮 Police Emergency", "number": "100",           "color": "#ffebee"},
    {"name": "🚑 Ambulance",         "number": "102",           "color": "#e8f5e9"},
    {"name": "🆘 All Emergencies",   "number": "112",           "color": "#fce4ec"},
    {"name": "👩 Women Helpline",    "number": "1091",          "color": "#f3e5f5"},
    {"name": "🏠 Domestic Violence", "number": "181",           "color": "#e8eaf6"},
    {"name": "⚖️ Free Legal Aid",   "number": "1800-110-370",  "color": "#e3f2fd"},
    {"name": "👶 Child Helpline",    "number": "1098",          "color": "#e0f2f1"},
    {"name": "💻 Cyber Crime",       "number": "1930",          "color": "#fff8e1"},
]

STATE_COMMISSIONS = {
    "Delhi":       {"name": "Delhi Commission for Women",                  "phone": "011-23379181",  "website": "http://dcw.delhigovt.nic.in"},
    "Maharashtra": {"name": "Maharashtra State Commission for Women",      "phone": "022-20821013",  "website": "http://www.mscw.co.in"},
    "Karnataka":   {"name": "Karnataka State Women's Commission",          "phone": "080-22374497",  "website": ""},
    "Tamil Nadu":  {"name": "Tamil Nadu State Commission for Women",       "phone": "044-28592750",  "website": ""},
    "Uttar Pradesh":{"name": "UP State Women's Commission",               "phone": "0522-2305816",  "website": ""},
    "West Bengal": {"name": "West Bengal Commission for Women",            "phone": "033-22481211",  "website": ""},
    "Gujarat":     {"name": "Gujarat State Women's Commission",            "phone": "079-23254925",  "website": ""},
    "Rajasthan":   {"name": "Rajasthan State Commission for Women",        "phone": "0141-2779001",  "website": ""},
    "Telangana":   {"name": "Telangana State Commission for Women",        "phone": "040-23390840",  "website": ""},
    "Kerala":      {"name": "Kerala State Women's Commission",             "phone": "0471-2321554",  "website": ""},
}

PLACE_TYPES = [
    {"label": "👮 Police Station",      "query": "police station",                     "desc": "File FIR, emergency help, Zero FIR available"},
    {"label": "⚖️ District Court",      "query": "district court",                     "desc": "Civil & criminal cases, bail hearings"},
    {"label": "🏠 Women's Shelter",     "query": "women shelter home",                 "desc": "Safe shelter, counselling, legal support"},
    {"label": "🆘 One Stop Centre",     "query": "one stop centre women",              "desc": "Govt scheme — medical, legal, police under one roof"},
    {"label": "🏥 Government Hospital", "query": "government hospital",                "desc": "Medical examination, injury documentation"},
    {"label": "📋 Legal Aid Office",    "query": "district legal services authority",  "desc": "Free lawyers via NALSA"},
]


class LocationRequest(BaseModel):
    location: str


@router.post("/search")
async def search_locations(req: LocationRequest):
    enc = quote_plus(req.location)
    places = []
    for p in PLACE_TYPES:
        q = quote_plus(f"{p['query']} near {req.location}")
        places.append({
            "label": p["label"],
            "desc":  p["desc"],
            "url":   f"https://www.google.com/maps/search/{q}",
        })
    return {
        "location": req.location,
        "places":   places,
        "helplines": HELPLINES,
    }


@router.get("/helplines")
async def get_helplines():
    return {"helplines": HELPLINES}


@router.get("/states")
async def get_states():
    return {"states": list(STATE_COMMISSIONS.keys())}


@router.get("/commission/{state}")
async def get_commission(state: str):
    if state not in STATE_COMMISSIONS:
        return {"error": "State not found"}
    return STATE_COMMISSIONS[state]
