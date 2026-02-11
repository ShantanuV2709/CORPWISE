from fastapi import APIRouter, HTTPException, Request, Depends
from app.models.admin import AdminModel
from app.db.mongodb import db
from datetime import datetime
import secrets
from passlib.context import CryptContext

router = APIRouter(prefix="/api-keys", tags=["API Keys"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper to verify company_id from header (middleware should have set it, but we double check)
# Or we can rely on X-Company-ID header passed from frontend
async def get_current_company(request: Request):
    company_id = request.headers.get("X-Company-ID")
    if not company_id:
        raise HTTPException(status_code=400, detail="Missing X-Company-ID header")
    return company_id

@router.post("/generate")
async def generate_api_key(request: Request, name: str = "Default Key"):
    """
    Generate a new API key.
    Returns the raw key ONLY ONCE.
    """
    company_id = await get_current_company(request)
    
    # Check if admin exists
    admin = await AdminModel.get_by_company(company_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Company not found")

    # Generate key
    # Format: sk_corp_RandomString
    raw_key = f"sk_corp_{secrets.token_urlsafe(32)}"
    key_hash = pwd_context.hash(raw_key)
    
    key_data = {
        "key_id": secrets.token_hex(8),
        "name": name,
        "key_hash": key_hash,
        "prefix": raw_key[:12], # Store prefix for display
        "created_at": datetime.utcnow(),
        "last_used": None,
        "status": "active"
    }
    
    await AdminModel.add_api_key(company_id, key_data)
    
    return {
        "status": "success",
        "key": raw_key,
        "key_data": {k: v for k, v in key_data.items() if k != "key_hash"}
    }

@router.get("/")
async def list_api_keys(request: Request):
    """List all API keys for the company (masked)."""
    company_id = await get_current_company(request)
    keys = await AdminModel.get_api_keys(company_id)
    
    # Filter out sensitive data (key_hash) just in case
    clean_keys = []
    for k in keys:
        clean_keys.append({
            "key_id": k["key_id"],
            "name": k.get("name", "Unnamed Key"),
            "prefix": k.get("prefix", "sk_corp_..."),
            "created_at": k["created_at"],
            "last_used": k.get("last_used"),
            "status": k["status"]
        })
        
    return {"status": "success", "keys": clean_keys}

@router.delete("/{key_id}")
async def revoke_api_key(key_id: str, request: Request):
    """Revoke an API key."""
    company_id = await get_current_company(request)
    await AdminModel.revoke_api_key(company_id, key_id)
    return {"status": "success", "message": "Key revoked"}
