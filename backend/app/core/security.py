from datetime import datetime
from app.models.admin import AdminModel
from passlib.context import CryptContext
from app.db.mongodb import db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
