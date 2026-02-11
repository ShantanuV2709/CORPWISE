import asyncio
from app.db.mongodb import db, connect_to_mongo

async def list_keys():
    await connect_to_mongo()
    company_id = "silaibook"
    
    # Check if company exists
    admin = await db.admins.find_one({"company_id": company_id})
    if not admin:
        print(f"Company '{company_id}' not found.")
        return

    keys = await db.api_keys.find({"company_id": company_id}).to_list(length=100)
    print(f"Found {len(keys)} keys for {company_id}:")
    for k in keys:
        print(f" - {k['name']}: {k.get('key', 'HIDDEN')} (Prefix: {k['prefix']})")
        # In a real app, we only store hash. But for verification, maybe we stored it?
        # Wait, the model stores 'key_hash'. We can't retrieve the full key from DB if we didn't save it elsewhere.
        # The user said "I have made an API key".
        # If I can't see the full key, I might have to generate a NEW one or ask the user.
        
    # Checking if we store the full key (unlikely for security)...
    # The Schema says: key_hash.
    
    # OK, so I cannot retrieve the full key from the DB.
    # I will have to ASK the user for the key OR generate a new one for testing and tell them.
    # The user said "I have made an API key".
    
if __name__ == "__main__":
    asyncio.run(list_keys())
