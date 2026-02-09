"""
Subscription Management API Routes
Endpoints for managing subscription tiers, usage, and company subscriptions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from app.models.subscription import get_all_tiers, get_tier_features
from app.models.admin_helpers import AdminSubscriptionHelpers

router = APIRouter(prefix="/subscription", tags=["Subscription"])


@router.get("/tiers")
async def get_subscription_tiers():
    """
    Get all available subscription tiers with features and pricing.
    Public endpoint for displaying on registration/upgrade page.
    """
    return {
        "tiers": get_all_tiers()
    }


@router.get("/tier/{tier_id}")
async def get_tier_details(tier_id: str):
    """Get detailed information about a specific tier."""
    try:
        tier = get_tier_features(tier_id)
        return {"tier_id": tier_id, **tier}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


class UpdateTierRequest(BaseModel):
    company_id: str
    new_tier: str


@router.put("/update-tier")
async def update_company_tier(payload: UpdateTierRequest):
    """
    Update a company's subscription tier.
    (For now, no payment - Super Admin or self-service upgrade)
    """
    try:
        await AdminSubscriptionHelpers.update_subscription_tier(
            payload.company_id, 
            payload.new_tier
        )
        return {
            "message": f"Subscription updated to {payload.new_tier}",
            "company_id": payload.company_id,
            "new_tier": payload.new_tier
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class SuspendCompanyRequest(BaseModel):
    company_id: str


@router.put("/suspend")
async def suspend_company(payload: SuspendCompanyRequest):
    """Suspend a company's subscription (Super Admin only)."""
    await AdminSubscriptionHelpers.update_subscription_status(
        payload.company_id,
        "suspended"
    )
    return {
        "message": "Company suspended",
        "company_id": payload.company_id
    }


@router.put("/activate")
async def activate_company(payload: SuspendCompanyRequest):
    """Reactivate a suspended company (Super Admin only)."""
    await AdminSubscriptionHelpers.update_subscription_status(
        payload.company_id,
        "active"
    )
    return {
        "message": "Company activated",
        "company_id": payload.company_id
    }
