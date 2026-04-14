# backend/routers/news.py
"""
Legal news feed from Live Law, Bar & Bench, Supreme Court Observer RSS.
Summarizes each article in the user's chosen language using Gemini.
"""
import re
import time
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

router = APIRouter(prefix="/news", tags=["news"])

RSS_SOURCES = [
    {
        "name": "Live Law",
        "url":  "https://feeds.feedburner.com/livelaw/fMCP",
        "icon": "⚖️",
    },
    {
        "name": "Bar & Bench",
        "url":  "https://feeds.feedburner.com/barandbench",
        "icon": "🏛️",
    },
    {
        "name": "Supreme Court Observer",
        "url":  "https://www.scobserver.in/feed/",
        "icon": "🔍",
    },
]

# Simple in-memory cache: (lang, source) → (articles, timestamp)
_cache: dict = {}
CACHE_TTL = 1800  # 30 minutes


def fetch_rss(url: str, max_items: int = 8) -> list[dict]:
    """Fetch and parse RSS feed. Returns list of {title, link, summary, pubDate}."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 NyaySahayak/2.0 legal-news-bot"}
        resp = requests.get(url, timeout=15, headers=headers)
        resp.raise_for_status()
        xml = resp.text

        articles = []
        # Simple regex XML parsing — no lxml dependency
        items = re.findall(r"<item>(.*?)</item>", xml, re.DOTALL)
        for item in items[:max_items]:
            def extract(tag: str) -> str:
                m = re.search(rf"<{tag}[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{tag}>",
                              item, re.DOTALL)
                return m.group(1).strip() if m else ""

            title   = extract("title")
            link    = extract("link") or re.search(r"<link>(.*?)</link>", item, re.DOTALL)
            summary = extract("description") or extract("summary")
            date    = extract("pubDate") or extract("dc:date") or ""

            # Clean HTML from summary
            summary = re.sub(r"<[^>]+>", "", summary)
            summary = re.sub(r"\s+", " ", summary).strip()[:300]

            if isinstance(link, re.Match): link = link.group(1).strip()

            if title:
                articles.append({
                    "title":   title,
                    "link":    link if isinstance(link, str) else "",
                    "summary": summary,
                    "date":    date[:30],
                })

        return articles
    except Exception as e:
        print(f"RSS fetch error for {url}: {e}")
        return []


def translate_articles(articles: list[dict], lang_code: str) -> list[dict]:
    """Translate title + summary to target language using Bhashini."""
    if lang_code == "en" or not articles:
        return articles

    from utils.ai_client import call_translation_api
    translated = []
    for art in articles:
        title = call_translation_api(art["title"], "en", lang_code) or art["title"]
        summary = call_translation_api(art["summary"][:200], "en", lang_code) or art["summary"] if art["summary"] else ""
        translated.append({**art, "title": title, "summary": summary})
    return translated


@router.get("/feed")
async def get_news(lang: str = "en", source: str = "all"):
    """
    Fetch latest legal news. Cached for 30 minutes.
    lang: Bhashini language code (en, hi, ta, etc.)
    source: 'all' or source name
    """
    cache_key = f"{lang}:{source}"
    cached = _cache.get(cache_key)
    if cached and (time.time() - cached["ts"]) < CACHE_TTL:
        return cached["data"]

    sources = RSS_SOURCES if source == "all" else [s for s in RSS_SOURCES if s["name"] == source]
    if not sources:
        raise HTTPException(status_code=404, detail="Unknown source")

    all_articles = []
    for src in sources:
        articles = fetch_rss(src["url"], max_items=6)
        for a in articles:
            a["source"] = src["name"]
            a["source_icon"] = src["icon"]
        all_articles.extend(articles)

    # Translate if needed
    if lang != "en":
        all_articles = translate_articles(all_articles, lang)

    result = {"articles": all_articles, "count": len(all_articles), "language": lang}
    _cache[cache_key] = {"data": result, "ts": time.time()}
    return result


@router.get("/sources")
async def get_sources():
    return {"sources": [{"name": s["name"], "icon": s["icon"]} for s in RSS_SOURCES]}
