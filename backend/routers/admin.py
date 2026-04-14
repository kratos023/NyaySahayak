# backend/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from routers.auth import require_admin
from utils.auth import get_all_accounts, delete_account, get_daily_stats
from utils.database import db

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def list_users(admin: dict = Depends(require_admin)):
    return {"users": get_all_accounts()}


@router.get("/users/{user_id}/chats")
async def user_chats(user_id: str, admin: dict = Depends(require_admin)):
    sessions = db.get_chat_sessions(user_id)
    return {"user_id": user_id, "sessions": sessions}


@router.get("/users/{user_id}/chats/{session_id}/messages")
async def session_messages(user_id: str, session_id: int, admin: dict = Depends(require_admin)):
    messages = db.get_session_messages(session_id)
    return {"session_id": session_id, "messages": messages}


@router.delete("/users/{user_id}")
async def remove_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["sub"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    success = delete_account(user_id)
    return {"success": success}


@router.delete("/chats/{session_id}")
async def remove_chat(session_id: int, admin: dict = Depends(require_admin)):
    success = db.delete_chat_session(session_id)
    return {"success": success}


@router.get("/stats")
async def get_stats(admin: dict = Depends(require_admin)):
    from utils.auth import get_language_stats, get_all_accounts
    system   = db.get_system_statistics()
    daily    = get_daily_stats(days=30)
    accounts = get_all_accounts()
    lang_stats = get_language_stats()
    return {
        "system":          system,
        "daily":           daily,
        "total_accounts":  len(accounts),
        "recent_users":    accounts[:5],
        "language_stats":  lang_stats,
    }
