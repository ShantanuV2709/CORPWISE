import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "corpwise")

async def migrate_docs():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    print(f"Connected to {DB_NAME}")
    
    # 1. Inspect
    docs = await db.documents.find({"company_id": {"$exists": False}}).to_list(length=1000)
    print(f"Found {len(docs)} documents without company_id.")
    
    # 2. Update
    if len(docs) > 0:
        result = await db.documents.update_many(
            {"company_id": {"$exists": False}},
            {"$set": {"company_id": "silaibook"}}
        )
        print(f"Updated {result.modified_count} documents to 'silaibook'.")
    
    # 3. Verify
    all_docs = await db.documents.find({}).to_list(length=100)
    for doc in all_docs:
        print(f"✅ Doc: {doc.get('filename')} -> {doc.get('company_id')}")

if __name__ == "__main__":
    asyncio.run(migrate_docs())
