"""
CodePerfect Auditor — JWT Authentication Module
Roles: admin, supervisor, coder
"""
import os
import hashlib
import hmac
import json
import base64
import time
import logging
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get("JWT_SECRET", "codeperfect-jatayu-secret-2026-change-in-prod")
TOKEN_EXPIRE_HOURS = 24

# ── Role definitions ──────────────────────────────────────────────────────────
ROLES = {
    "admin":      {"label": "Administrator",   "can_delete": True,  "can_view_all": True,  "can_audit": True},
    "supervisor": {"label": "Supervisor",      "can_delete": False, "can_view_all": True,  "can_audit": True},
    "coder":      {"label": "Medical Coder",   "can_delete": False, "can_view_all": False, "can_audit": True},
}

# ── User store (file-based for POC, replace with DB in production) ───────────
USERS_FILE = Path(__file__).parent / "users.json"

DEFAULT_USERS = [
    {"username": "admin",      "password": "Admin@2026",    "role": "admin",      "name": "System Admin",    "email": "admin@codeperfect.ai"},
    {"username": "supervisor", "password": "Super@2026",    "role": "supervisor", "name": "Dr. Sarah Chen",  "email": "supervisor@codeperfect.ai"},
    {"username": "coder1",     "password": "Coder@2026",    "role": "coder",      "name": "Baji Shaik",      "email": "coder1@codeperfect.ai"},
    {"username": "coder2",     "password": "Coder2@2026",   "role": "coder",      "name": "Teja Sarat D",    "email": "coder2@codeperfect.ai"},
    {"username": "demo",       "password": "Demo@2026",     "role": "coder",      "name": "Demo User",       "email": "demo@codeperfect.ai"},
]

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _load_users() -> list:
    if USERS_FILE.exists():
        try:
            return json.loads(USERS_FILE.read_text())
        except:
            pass
    # Seed default users with hashed passwords
    users = []
    for u in DEFAULT_USERS:
        users.append({**u, "password_hash": _hash_password(u["password"]), "password": None})
    USERS_FILE.write_text(json.dumps(users, indent=2))
    return users

def _save_users(users: list):
    USERS_FILE.write_text(json.dumps(users, indent=2))

def _find_user(username: str) -> Optional[dict]:
    users = _load_users()
    return next((u for u in users if u["username"].lower() == username.lower()), None)

# ── Simple JWT implementation (no external library needed) ────────────────────
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    if pad != 4:
        s += "=" * pad
    return base64.urlsafe_b64decode(s)

def create_token(username: str, role: str) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url_encode(json.dumps({
        "sub": username,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRE_HOURS * 3600
    }).encode())
    sig = _b64url_encode(hmac.new(
        SECRET_KEY.encode(),
        f"{header}.{payload}".encode(),
        hashlib.sha256
    ).digest())
    return f"{header}.{payload}.{sig}"

def verify_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        expected_sig = _b64url_encode(hmac.new(
            SECRET_KEY.encode(),
            f"{header}.{payload}".encode(),
            hashlib.sha256
        ).digest())
        if not hmac.compare_digest(sig, expected_sig):
            return None
        data = json.loads(_b64url_decode(payload))
        if data.get("exp", 0) < time.time():
            return None
        return data
    except:
        return None

# ── FastAPI dependencies ───────────────────────────────────────────────────────
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = _find_user(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user["username"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "permissions": ROLES.get(user["role"], {}),
    }

async def require_supervisor(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] not in ("admin", "supervisor"):
        raise HTTPException(status_code=403, detail="Supervisor access required")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Optional auth — returns None if no token (for demo-friendly endpoints)
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except:
        return None

# ── Pydantic models ───────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    name: str
    role: str
    permissions: dict
    expires_in: int = TOKEN_EXPIRE_HOURS * 3600

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    name: str
    email: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ── Auth API routes ────────────────────────────────────────────────────────────
def register_auth_routes(app):
    """Call this in main.py to register all auth endpoints."""

    @app.post("/api/auth/login", response_model=LoginResponse, tags=["auth"])
    async def login(req: LoginRequest):
        user = _find_user(req.username)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        password_hash = _hash_password(req.password)
        if user.get("password_hash") != password_hash:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        token = create_token(user["username"], user["role"])
        logger.info(f"Login: {user['username']} ({user['role']})")
        return LoginResponse(
            access_token=token,
            username=user["username"],
            name=user["name"],
            role=user["role"],
            permissions=ROLES.get(user["role"], {}),
        )

    @app.post("/api/auth/logout", tags=["auth"])
    async def logout(user: dict = Depends(get_current_user)):
        # JWT is stateless — client deletes token
        # For production: add token to blocklist in Redis
        logger.info(f"Logout: {user['username']}")
        return {"message": "Logged out successfully"}

    @app.get("/api/auth/me", tags=["auth"])
    async def get_me(user: dict = Depends(get_current_user)):
        return user

    @app.post("/api/auth/change-password", tags=["auth"])
    async def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
        users = _load_users()
        u = next((u for u in users if u["username"] == user["username"]), None)
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        if u.get("password_hash") != _hash_password(req.current_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(req.new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        u["password_hash"] = _hash_password(req.new_password)
        _save_users(users)
        return {"message": "Password changed successfully"}

    @app.get("/api/auth/users", tags=["auth"])
    async def list_users(admin: dict = Depends(require_admin)):
        users = _load_users()
        return [{"username": u["username"], "name": u["name"], "email": u["email"],
                 "role": u["role"]} for u in users]

    @app.post("/api/auth/users", tags=["auth"])
    async def create_user(req: UserCreate, admin: dict = Depends(require_admin)):
        if req.role not in ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {list(ROLES.keys())}")
        users = _load_users()
        if any(u["username"].lower() == req.username.lower() for u in users):
            raise HTTPException(status_code=409, detail="Username already exists")
        if len(req.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        new_user = {
            "username": req.username,
            "name": req.name,
            "email": req.email,
            "role": req.role,
            "password_hash": _hash_password(req.password),
            "password": None,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": admin["username"],
        }
        users.append(new_user)
        _save_users(users)
        logger.info(f"User created: {req.username} ({req.role}) by {admin['username']}")
        return {"username": req.username, "name": req.name, "role": req.role, "message": "User created"}

    @app.delete("/api/auth/users/{username}", tags=["auth"])
    async def delete_user(username: str, admin: dict = Depends(require_admin)):
        if username == admin["username"]:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        users = _load_users()
        filtered = [u for u in users if u["username"] != username]
        if len(filtered) == len(users):
            raise HTTPException(status_code=404, detail="User not found")
        _save_users(filtered)
        return {"message": f"User {username} deleted"}

    @app.get("/api/auth/roles", tags=["auth"])
    async def get_roles():
        return ROLES
