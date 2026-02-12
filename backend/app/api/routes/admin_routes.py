from fastapi import APIRouter, HTTPException, Depends, Header
from app.db.mongodb import db
from app.db.pinecone_client import get_index

router = APIRouter(prefix="/super", tags=["Super Admin"])

# Dependency to check for Super Admin
# In a real app, we'd verify a JWT token. 
# Here we trust the client to send a header, OR we can just rely on the fact 
# that this endpoint is only known to the SuperAdminDashboard which gates access.
# For better security, let's demand a secret header.
async def verify_super_admin(x_super_token: str = Header(None)):
    from app.core.config import SUPER_USER_KEY
    if not SUPER_USER_KEY:
        raise HTTPException(status_code=500, detail="Super User Key not configured")
        
    if x_super_token != SUPER_USER_KEY: 
         raise HTTPException(status_code=403, detail="Unauthorized")

@router.get("/companies", dependencies=[Depends(verify_super_admin)])
async def get_all_companies():
    """List all registered organizations with subscription details."""
    # Return full admin documents excluding password and including subscription data
    cursor = db.admins.find({}, {"password": 0, "_id": 0})
    companies = await cursor.to_list(length=1000)
    
    # Enrich with real-time usage data
    for company in companies:
        company_id = company.get("company_id")
        if company_id:
            doc_count = await db.documents.count_documents({"company_id": company_id})
            
            # Ensure usage dict exists
            if "usage" not in company:
                company["usage"] = {}
                
            company["usage"]["documents_count"] = doc_count
            
    return companies

@router.delete("/company/{company_id}", dependencies=[Depends(verify_super_admin)])
async def delete_company(company_id: str):
    """
    Hard delete an organization and all its data.
    - Admin Account
    - User Accounts
    - Documents (Metadata & File chunks)
    - Conversations
    - Pinecone Vectors (Namespace delete)
    """
    
    company_id = company_id.lower()
    
    # 1. Delete Admin Account
    res_admin = await db.admins.delete_one({"company_id": company_id})
    
    # 2. Delete Employee Accounts
    res_users = await db.users.delete_many({"company_id": company_id})
    
    # 3. Delete Documents & Metadata
    res_docs = await db.documents.delete_many({"company_id": company_id})
    
    # 4. Delete Conversations
    res_convs = await db.conversations.delete_many({"company_id": company_id})
    
    # 5. Delete Pinecone Vectors (Namespace)
    try:
        index = get_index()
        # Pinecone delete_all(namespace=...)
        index.delete(delete_all=True, namespace=company_id)
        pinecone_status = "Deleted Namespace"
    except Exception as e:
        pinecone_status = f"Pinecone Error: {str(e)}"

    return {
        "message": f"Company '{company_id}' deleted successfully.",
        "details": {
            "admin_deleted": res_admin.deleted_count,
            "users_deleted": res_users.deleted_count,
            "docs_deleted": res_docs.deleted_count,
            "conversations_deleted": res_convs.deleted_count,
            "vectors_status": pinecone_status
        }
    }


# =====================================================
# Subscription Management Endpoints
# =====================================================
from pydantic import BaseModel
from app.models.admin_helpers import AdminSubscriptionHelpers
from app.models.subscription import get_tier_features, SUBSCRIPTION_TIERS

class UpdateTierRequest(BaseModel):
    new_tier: str

class UpdateStatusRequest(BaseModel):
    status: str


@router.put("/company/{company_id}/tier", dependencies=[Depends(verify_super_admin)])
async def update_company_tier(company_id: str, payload: UpdateTierRequest):
    """Update a company's subscription tier."""
    company_id = company_id.lower()
    
    # Validate tier exists
    if payload.new_tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid tier. Choose from: {list(SUBSCRIPTION_TIERS.keys())}"
        )
    
    try:
        await AdminSubscriptionHelpers.update_subscription_tier(company_id, payload.new_tier)
        tier_info = get_tier_features(payload.new_tier)
        
        return {
            "message": f"Tier updated to {tier_info['name']}",
            "company_id": company_id,
            "new_tier": payload.new_tier,
            "features": tier_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/company/{company_id}/status", dependencies=[Depends(verify_super_admin)])
async def update_company_status(company_id: str, payload: UpdateStatusRequest):
    """Update a company's subscription status (active/suspended/cancelled)."""
    company_id = company_id.lower()
    
    valid_statuses = ["active", "suspended", "cancelled", "trial"]
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Choose from: {valid_statuses}"
        )
    
    try:
        await AdminSubscriptionHelpers.update_subscription_status(company_id, payload.status)
        return {
            "message": f"Status updated to {payload.status}",
            "company_id": company_id,
            "new_status": payload.status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics", dependencies=[Depends(verify_super_admin)])
async def get_platform_statistics():
    """Get platform-wide statistics."""
    try:
        # Count companies by status
        total_companies = await db.admins.count_documents({"is_super_admin": False})
        active_companies = await db.admins.count_documents({
            "is_super_admin": False,
            "subscription_status": "active"
        })
        suspended_companies = await db.admins.count_documents({
            "is_super_admin": False,
            "subscription_status": "suspended"
        })
        
        # Aggregate total documents across all companies from the source of truth
        total_documents = await db.documents.count_documents({})
        
        # Aggregate total queries this month
        total_queries_result = await db.admins.aggregate([
            {"$match": {"is_super_admin": False}},
            {"$group": {"_id": None, "total": {"$sum": "$usage.queries_this_month"}}}
        ]).to_list(length=1)
        total_queries = total_queries_result[0]["total"] if total_queries_result else 0
        
        # Count by tier
        tier_counts = {}
        for tier_id in SUBSCRIPTION_TIERS.keys():
            count = await db.admins.count_documents({
                "is_super_admin": False,
                "subscription_tier": tier_id
            })
            tier_counts[tier_id] = count
        
        return {
            "total_companies": total_companies,
            "active_companies": active_companies,
            "suspended_companies": suspended_companies,
            "trial_companies": await db.admins.count_documents({
                "is_super_admin": False,
                "subscription_status": "trial"
            }),
            "cancelled_companies": await db.admins.count_documents({
                "is_super_admin": False,
                "subscription_status": "cancelled"
            }),
            "total_documents": total_documents,
            "total_queries_this_month": total_queries,
            "tier_distribution": tier_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")

