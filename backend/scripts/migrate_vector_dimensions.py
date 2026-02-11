"""
Migration Script: Add vector_dimensions to Existing Companies

This script updates all existing companies in MongoDB to include the 
vector_dimensions field based on their subscription tier.

Run this once after deploying multi-dimension architecture.
"""

import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).parent.parent
sys.path.append(str(backend_root))

from dotenv import load_dotenv
load_dotenv(backend_root / ".env")

from app.db.mongodb import db
from app.models.subscription import get_tier_dimensions


async def migrate_companies():
    """Add vector_dimensions field to all companies based on their tier."""
    
    print("🔄 Starting migration: Adding vector_dimensions to companies...")
    print("="*60)
    
    # Get all companies
    companies = await db.admins.find({}).to_list(length=None)
    
    if not companies:
        print("ℹ️  No companies found in database")
        return
    
    print(f"📊 Found {len(companies)} companies")
    print()
    
    updated_count = 0
    skipped_count = 0
    
    for company in companies:
        company_id = company.get("company_id", "unknown")
        tier = company.get("subscription_tier", "starter")
        current_dims = company.get("vector_dimensions")
        
        # Get correct dimensions for tier
        try:
            correct_dims = get_tier_dimensions(tier)
        except ValueError:
            print(f"⚠️  {company_id}: Invalid tier '{tier}', defaulting to 'starter' (384 dims)")
            tier = "starter"
            correct_dims = 384
        
        # Check if already has correct dimensions
        if current_dims == correct_dims:
            print(f"✓ {company_id}: Already has {correct_dims} dims (tier: {tier}) - SKIP")
            skipped_count += 1
            continue
        
        # Update company
        result = await db.admins.update_one(
            {"company_id": company_id},
            {"$set": {"vector_dimensions": correct_dims}}
        )
        
        if result.modified_count > 0:
            status = "UPDATED" if current_dims is None else f"CHANGED {current_dims}→{correct_dims}"
            print(f"✅ {company_id}: {status} (tier: {tier} → {correct_dims} dims)")
            updated_count += 1
        else:
            print(f"⚠️  {company_id}: Update failed")
    
    print()
    print("="*60)
    print(f"✅ Migration complete!")
    print(f"   Updated: {updated_count}")
    print(f"   Skipped: {skipped_count}")
    print(f"   Total:   {len(companies)}")
    print()
    
    # Show dimension distribution
    print("📊 Dimension Distribution:")
    pipeline = [
        {"$group": {
            "_id": "$vector_dimensions",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    distribution = await db.admins.aggregate(pipeline).to_list(length=None)
    for item in distribution:
        dims = item["_id"] if item["_id"] is not None else "None"
        count = item["count"]
        print(f"   {dims} dims: {count} companies")
    
    print()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("  MULTI-DIMENSION MIGRATION SCRIPT")
    print("="*60 + "\n")
    
    # Set event loop policy for Windows
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(migrate_companies())
    
    print("✅ Done!")
