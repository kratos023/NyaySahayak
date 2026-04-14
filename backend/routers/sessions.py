# backend/routers/sessions.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.database import db

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/{user_id}")
async def get_sessions(user_id: str):
    try:
        sessions = db.get_chat_sessions(user_id)
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/messages")
async def get_messages(session_id: int):
    try:
        messages = db.get_session_messages(session_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{session_id}")
async def delete_session(session_id: int):
    try:
        success = db.delete_chat_session(session_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/new")
async def new_session(user_id: str):
    try:
        db.deactivate_other_sessions(user_id, -1)
        return {"status": "ok", "message": "All sessions deactivated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
