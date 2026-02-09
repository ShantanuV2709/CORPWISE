from datetime import datetime
from app.db.mongodb import db
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AdminModel:
    """Model for Organization Admins (stored in 'admins' collection)."""
    
    @staticmethod
    async def create(username, password, company_id, subscription_tier="professional"):
        # Enforce lowercase
        company_id = company_id.lower()
        
        try:
            hashed_password = pwd_context.hash(password)
        except ValueError as e:
            # Handle "password cannot be longer than 72 bytes"
            if "longer than 72 bytes" in str(e):
                raise ValueError("Password is too long (max 72 characters)")
            raise e

        # Import subscription tier config
        from app.models.subscription import get_tier_features
        tier_features = get_tier_features(subscription_tier)

        doc = {
            "username": username,
            "password": hashed_password,
            "company_id": company_id,
            "is_super_admin": False, # Default to False
            "subscription_tier": subscription_tier,
            "subscription_status": "active",
            "features": {
                "max_documents": tier_features["max_documents"],
                "max_queries_per_month": tier_features["max_queries_per_month"],
                "analytics_enabled": tier_features["analytics_enabled"],
                "custom_branding": tier_features["custom_branding"],
                "priority_support": tier_features["priority_support"]
            },
            "usage": {
                "documents_count": 0,
                "queries_this_month": 0,
                "last_query_date": None,
                "last_reset_date": datetime.utcnow()
            },
            "created_at": datetime.utcnow(),
            "subscription_date": datetime.utcnow()
        }
        await db.admins.insert_one(doc)
        return doc

    @staticmethod
    async def get_by_username(username):
        return await db.admins.find_one({"username": username})
        
    @staticmethod
    async def get_by_company(company_id):
         return await db.admins.find_one({"company_id": company_id.lower()})

    @staticmethod
    async def verify_admin(company_id, password):
        # Admin login uses CompanyID + Password (different from Employee which is User+Pass)
        # Wait, the frontend AdminAuth prompts for "CompanyID", "Username", "Password".
        # Let's align with that: verify by username (which must belong to company_id).
        pass

    @staticmethod
    async def verify_credentials(username, password, company_id):
        user = await db.admins.find_one({
            "username": username,
            "company_id": company_id.lower()
        })
        if not user:
            return None
        if not pwd_context.verify(password, user["password"]):
            return None
        return user
