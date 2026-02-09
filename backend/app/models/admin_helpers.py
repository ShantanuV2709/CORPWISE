"""
Helper methods for subscription management in AdminModel.
These extend the core AdminModel with subscription-specific functionality.
"""

from datetime import datetime
from app.db.mongodb import db


class AdminSubscriptionHelpers:
    """Helper methods for managing subscriptions."""
    
    @staticmethod
    async def update_subscription_tier(company_id: str, new_tier: str):
        """Update company's subscription tier and features."""
        from app.models.subscription import get_tier_features
        tier_features = get_tier_features(new_tier)
        
        await db.admins.update_one(
            {"company_id": company_id.lower()},
            {
                "$set": {
                    "subscription_tier": new_tier,
                    "features": {
                        "max_documents": tier_features["max_documents"],
                        "max_queries_per_month": tier_features["max_queries_per_month"],
                        "analytics_enabled": tier_features["analytics_enabled"],
                        "custom_branding": tier_features["custom_branding"],
                        "priority_support": tier_features["priority_support"]
                    }
                }
            }
        )
    
    @staticmethod
    async def increment_query_count(company_id: str):
        """Increment monthly query count for a company."""
        await db.admins.update_one(
            {"company_id": company_id.lower()},
            {
                "$inc": {"usage.queries_this_month": 1},
                "$set": {"usage.last_query_date": datetime.utcnow()}
            }
        )
    
    @staticmethod
    async def increment_document_count(company_id: str, increment: int = 1):
        """Increment document count for a company."""
        await db.admins.update_one(
            {"company_id": company_id.lower()},
            {"$inc": {"usage.documents_count": increment}}
        )
    
    @staticmethod
    async def reset_monthly_usage():
        """Reset monthly query counts for all companies (run via cron)."""
        await db.admins.update_many(
            {},
            {
                "$set": {
                    "usage.queries_this_month": 0,
                    "usage.last_reset_date": datetime.utcnow()
                }
            }
        )
    
    @staticmethod
    async def get_all_companies():
        """Get all companies with subscription info (for super admin)."""
        cursor = db.admins.find({"is_super_admin": False})
        return await cursor.to_list(length=None)
    
    @staticmethod
    async def update_subscription_status(company_id: str, status: str):
        """Update subscription status (active, suspended, cancelled)."""
        await db.admins.update_one(
            {"company_id": company_id.lower()},
            {"$set": {"subscription_status": status}}
        )

