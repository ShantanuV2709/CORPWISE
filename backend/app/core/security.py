from datetime import datetime, timedelta
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, SUPER_USER_KEY
from app.models.admin import AdminModel
from passlib.context import CryptContext
from app.db.mongodb import db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        # If payload represents super admin, we can still parse it but handle it properly if routes expect `company_id`.
        # Usually superadmin payload doesn't have company_id OR company_id is "GLOBAL".
        # If it's a regular admin, they *must* have a company_id.
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_super_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Not authorized as super admin")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_api_key(api_key: str, company_id: str) -> dict | None:
    """
    Verify an API key for a specific company.
    Returns the key entry (dict) if valid, None otherwise.
    Also updates the 'last_used' timestamp of the key.
    """
    if not api_key or not company_id:
        return None

    # Get admin/company
    admin = await AdminModel.get_by_company(company_id)
    if not admin:
        return None

    api_keys = admin.get("api_keys", [])
    
    for key_entry in api_keys:
        # Check if key matches specific entry
        if pwd_context.verify(api_key, key_entry["key_hash"]):
            # Key is valid!
            # Update last_used timestamp async (fire and forget pattern ideally, but await here is fine)
            await AdminModel.update_api_key_usage(company_id, key_entry["key_id"])
            return key_entry

    return None
