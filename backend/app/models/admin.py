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
        from app.models.subscription import get_tier_features, get_tier_dimensions
        tier_features = get_tier_features(subscription_tier)
        vector_dimensions = get_tier_dimensions(subscription_tier)

        doc = {
            "username": username,
            "password": hashed_password,
            "company_id": company_id,
            "is_super_admin": False, # Default to False
            "subscription_tier": subscription_tier,
            "subscription_status": "active",
            "vector_dimensions": vector_dimensions,  # NEW: track tier dimensions
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
            "api_keys": [],
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

    @staticmethod
    async def add_api_key(company_id, key_data):
        """Add a new API key to the company admin document."""
        await db.admins.update_one(
            {"company_id": company_id.lower()},
            {"$push": {"api_keys": key_data}}
        )
        return key_data

    @staticmethod
    async def get_api_keys(company_id):
        """Get all API keys for a company."""
        doc = await db.admins.find_one(
            {"company_id": company_id.lower()},
            {"api_keys": 1, "_id": 0}
        )
        return doc.get("api_keys", []) if doc else []

    @staticmethod
    async def revoke_api_key(company_id, key_id):
        """Revoke (remove) an API key."""
        await db.admins.update_one(
            {"company_id": company_id.lower()},
            {"$pull": {"api_keys": {"key_id": key_id}}}
        )

    @staticmethod
    async def verify_api_key(key_hash):
        """Verify an API key hash and return the company document."""
        # Find admin with this key hash
        # Note: Ensure index on 'api_keys.key_hash' for performance
        admin = await db.admins.find_one(
            {"api_keys.key_hash": key_hash},
            {"company_id": 1, "username": 1, "subscription_tier": 1, "features": 1, "usage": 1}
        )
        return admin

    @staticmethod
    async def update_api_key_usage(company_id, key_id):
        """Update the last_used timestamp for a specific API key."""
        await db.admins.update_one(
            {
                "company_id": company_id.lower(),
                "api_keys.key_id": key_id
            },
            {
                "$set": {"api_keys.$.last_used": datetime.utcnow()}
            }
        )
