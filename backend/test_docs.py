import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['corpwise']
    
    async for d in db.documents.find().limit(5):
        print(f"File: {d.get('filename')}, Size: {d.get('file_size')}, Uploaded: {d.get('uploaded_at')}")

if __name__ == '__main__':
    asyncio.run(main())
