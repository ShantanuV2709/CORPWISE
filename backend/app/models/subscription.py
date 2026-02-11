"""
Subscription Tier Definitions and Management
Defines available subscription tiers and their features/limits.
"""

from typing import Dict, Any

# Subscription Tier Configurations
SUBSCRIPTION_TIERS: Dict[str, Dict[str, Any]] = {
    "starter": {
        "name": "Starter",
        "description": "Perfect for small firms and startups",
        "vector_dimensions": 384,  # Lightweight, fast embeddings
        "embedding_model": "all-MiniLM-L6-v2",
        "max_documents": 20,
        "max_queries_per_month": 5000,
        "max_employees": 50,
        "analytics_enabled": False,
        "custom_branding": False,
        "priority_support": False,
        "price_monthly": 4000,
        "price_display": "₹4,000/month"
    },
    "professional": {
        "name": "Professional",
        "description": "Ideal for growing mid-size companies",
        "vector_dimensions": 768,  # Balanced accuracy for technical docs
        "embedding_model": "BAAI/bge-base-en-v1.5",
        "max_documents": 100,
        "max_queries_per_month": 25000,
        "max_employees": 200,
        "analytics_enabled": True,
        "custom_branding": False,
        "priority_support": True,
        "price_monthly": 12000,
        "price_display": "₹12,000/month"
    },
    "enterprise": {
        "name": "Enterprise",
        "description": "Complete solution for large organizations",
        "vector_dimensions": 1024,  # Maximum quality for specialized content
        "embedding_model": "BAAI/bge-large-en-v1.5",
        "max_documents": -1,  # Unlimited
        "max_queries_per_month": -1,  # Unlimited
        "max_employees": -1,  # Unlimited
        "analytics_enabled": True,
        "custom_branding": True,
        "priority_support": True,
        "price_monthly": None,
        "price_display": "Custom Pricing"
    }
}

SUBSCRIPTION_STATUS = {
    "active": "Active",
    "suspended": "Suspended",
    "cancelled": "Cancelled",
    "trial": "Trial"
}


def get_tier_features(tier_id: str) -> Dict[str, Any]:
    """Get features for a specific subscription tier."""
    if tier_id not in SUBSCRIPTION_TIERS:
        raise ValueError(f"Invalid subscription tier: {tier_id}")
    return SUBSCRIPTION_TIERS[tier_id]


def get_all_tiers() -> Dict[str, Dict[str, Any]]:
    """Get all available subscription tiers."""
    return SUBSCRIPTION_TIERS


def check_document_limit(tier_id: str, current_count: int) -> bool:
    """Check if document upload is within tier limits."""
    tier = get_tier_features(tier_id)
    max_docs = tier["max_documents"]
    
    # -1 means unlimited
    if max_docs == -1:
        return True
    
    return current_count < max_docs


def check_query_limit(tier_id: str, current_count: int) -> bool:
    """Check if query count is within tier limits."""
    tier = get_tier_features(tier_id)
    max_queries = tier["max_queries_per_month"]
    
    # -1 means unlimited
    if max_queries == -1:
        return True
    
    return current_count < max_queries


def get_tier_display_name(tier_id: str) -> str:
    """Get display name for a tier."""
    return SUBSCRIPTION_TIERS.get(tier_id, {}).get("name", "Unknown")


def get_tier_dimensions(tier_id: str) -> int:
    """Get vector dimensions for a subscription tier."""
    tier = get_tier_features(tier_id)
    return tier.get("vector_dimensions", 384)  # Default to starter


def get_tier_model(tier_id: str) -> str:
    """Get embedding model name for a subscription tier."""
    tier = get_tier_features(tier_id)
    return tier.get("embedding_model", "all-MiniLM-L6-v2")  # Default to starter
