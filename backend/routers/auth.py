# backend/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.auth import (
    create_account, get_account_by_email, verify_password,
    create_token, decode_token, update_last_login
)

router  = APIRouter(prefix="/auth", tags=["auth"])
bearer  = HTTPBearer(auto_error=False)


# ── Schemas ───────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str
    user_id: str
    email: str
    name: str
    role: str


# ── Dependency: get current user from Bearer token ────────────────────────────
def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse)
async def signup(req: SignupRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if len(req.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name too short")

    result = create_account(req.email.lower().strip(), req.name.strip(), req.password)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    token = create_token(result["user_id"], result["email"], result["role"])
    return TokenResponse(token=token, **result)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    account = get_account_by_email(req.email.lower().strip())

    if not account or not verify_password(req.password, account["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    update_last_login(account["user_id"])
    token = create_token(account["user_id"], account["email"], account["role"])

    return TokenResponse(
        token=token,
        user_id=account["user_id"],
        email=account["email"],
        name=account["name"],
        role=account["role"],
    )


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    account = get_account_by_email(user["email"])
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return {
        "user_id":    account["user_id"],
        "email":      account["email"],
        "name":       account["name"],
        "role":       account["role"],
        "created_at": account["created_at"],
        "last_login": account["last_login"],
    }
