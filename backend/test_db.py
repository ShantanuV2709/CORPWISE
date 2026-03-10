import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['corpwise']
        
    print('\n--- API Keys ---')
    async for k in db.api_keys.find().limit(5):
        print(f"Key ID: {k.get('_id')}, Company: {k.get('company_id')}, Name: {k.get('name')}")

if __name__ == '__main__':
    asyncio.run(main())
