"""
Usage Limit Enforcement Middleware

Checks if companies have exceeded their subscription tier limits
before processing requests.
"""

from fastapi import Request, HTTPException
from app.db.mongodb import db
from app.models.subscription import get_tier_features


async def check_usage_limits(request: Request, company_id: str, action: str):
    """
    Check if company can perform action based on tier limits.
    
    Args:
        request: FastAPI request object
        company_id: Company identifier
        action: "query" or "document"
    
    Raises:
        HTTPException: 404 if company not found, 429 if limit exceeded
    """
    # Fetch company from database
    company = await db.admins.find_one({"company_id": company_id.lower()})
    
    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"Company '{company_id}' not found"
        )
    
    # Check if subscription is active
    if company.get("subscription_status") != "active":
        raise HTTPException(
            status_code=403,
            detail=f"Subscription is {company.get('subscription_status')}. Please contact support."
        )
    
    # Get tier limits
    tier = company.get("subscription_tier", "starter")
    tier_features = get_tier_features(tier)
    usage = company.get("usage", {})
    
    if action == "query":
        max_queries = tier_features["max_queries_per_month"]
        current_queries = usage.get("queries_this_month", 0)
        
        # -1 means unlimited
        if max_queries != -1 and current_queries >= max_queries:
            raise HTTPException(
                status_code=429,
                detail=f"Monthly query limit reached ({current_queries}/{max_queries}). Please upgrade your plan or wait for next billing cycle."
            )
        
        print(f"📊 USAGE CHECK: {company_id} queries: {current_queries}/{max_queries}")
    
    elif action == "document":
        max_docs = tier_features["max_documents"]
        current_docs = usage.get("documents_count", 0)
        
        # -1 means unlimited
        if max_docs != -1 and current_docs >= max_docs:
            raise HTTPException(
                status_code=429,
                detail=f"Document limit reached ({current_docs}/{max_docs}). Please upgrade your plan to upload more documents."
            )
        
        print(f"📊 USAGE CHECK: {company_id} documents: {current_docs}/{max_docs}")
    
    else:
        raise ValueError(f"Invalid action: {action}. Must be 'query' or 'document'")
