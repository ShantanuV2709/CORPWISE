import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "corpwise")

async def inspect_docs():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    print(f"Connected to {DB_NAME}")
    
    docs = await db.documents.find({}).to_list(length=100)
    print(f"Found {len(docs)} documents total.")
    
    for doc in docs:
        cid = doc.get("company_id", "MISSING")
        print(f"ID: {doc['_id']} | File: {doc.get('filename')} | Company: {cid} | Status: {doc.get('status')}")

if __name__ == "__main__":
    asyncio.run(inspect_docs())
