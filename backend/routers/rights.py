# backend/routers/rights.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.rights_data import RIGHTS_CATEGORIES
from utils.ai_client import call_translation_api, LANGUAGES

router = APIRouter(prefix="/rights", tags=["rights"])


@router.get("/categories")
async def get_categories():
    """Return all rights categories with metadata (no rights list yet)."""
    return {
        "categories": [
            {
                "id":     c["id"],
                "icon":   c["icon"],
                "title":  c["title"],
                "color":  c["color"],
                "accent": c["accent"],
                "helpline": c["helpline"],
            }
            for c in RIGHTS_CATEGORIES
        ]
    }


@router.get("/category/{category_id}")
async def get_category(category_id: str, lang: str = "en"):
    """Return full rights for a category, translated if needed."""
    cat = next((c for c in RIGHTS_CATEGORIES if c["id"] == category_id), None)
    if not cat:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Category not found")

    rights = cat["rights"]
    laws   = cat["laws"]
    title  = cat["title"]

    # Translate if not English
    if lang != "en":
        translated_rights = []
        for r in rights:
            t = call_translation_api(r, "en", lang)
            translated_rights.append(t if t else r)
        rights = translated_rights

        t_title = call_translation_api(title, "en", lang)
        if t_title: title = t_title

    return {
        "id":       cat["id"],
        "icon":     cat["icon"],
        "title":    title,
        "color":    cat["color"],
        "accent":   cat["accent"],
        "rights":   rights,
        "laws":     laws,
        "helpline": cat["helpline"],
    }
