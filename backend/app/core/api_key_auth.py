"""
API Key Authentication Middleware

Verifies API keys from request headers and returns company_id.
Provides secure authentication for external app integrations.
"""

from fastapi import Request, HTTPException
from app.db.mongodb import db
import secrets


async def verify_api_key(request: Request) -> str:
    """
    Verify API key from X-API-Key header and return company_id.
    
    Args:
        request: FastAPI request object
    
    Returns:
        str: Authenticated company_id
    
    Raises:
        HTTPException: 401 if API key invalid or missing
                      403 if company is suspended
    """
    api_key = request.headers.get("X-API-Key")
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing X-API-Key header. Please provide a valid API key."
        )
    
    # Look up company by API key
    company = await db.admins.find_one({"api_key": api_key})
    
    if not company:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key. Please check your key and try again."
        )
    
    # Check if company subscription is active
    subscription_status = company.get("subscription_status", "active")
    if subscription_status != "active":
        raise HTTPException(
            status_code=403,
            detail=f"Account {subscription_status}. Please contact support or renew your subscription."
        )
    
    print(f"🔑 API KEY AUTH: Company '{company['company_id']}' authenticated")
    return company["company_id"]


def generate_api_key() -> str:
    """
    Generate a secure API key for a company.
    
    Format: sk_live_<32 random chars>
    """
    random_part = secrets.token_urlsafe(32)
    return f"sk_live_{random_part}"


def generate_test_api_key() -> str:
    """
    Generate a test/sandbox API key.
    
    Format: sk_test_<32 random chars>
    """
    random_part = secrets.token_urlsafe(32)
    return f"sk_test_{random_part}"
