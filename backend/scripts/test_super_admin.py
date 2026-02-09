import asyncio
import httpx
import sys

API_BASE = "http://localhost:8001"
SUPER_TOKEN = "masterkey123"

async def test_super_admin():
    async with httpx.AsyncClient() as client:
        print("1. Testing Super Admin List Companies...")
        try:
            res = await client.get(f"{API_BASE}/super/companies", headers={"x-super-token": SUPER_TOKEN})
            if res.status_code != 200:
                print(f"FAILED: {res.status_code} - {res.text}")
                return
            companies = res.json()
            print(f"SUCCESS: Found {len(companies)} companies.")
            if len(companies) > 0:
                print(f"Sample Company: {companies[0].get('company_id')} - Tier: {companies[0].get('subscription_tier')}")
                
        except Exception as e:
            print(f"ERROR: {e}")
            return

        print("\n2. Testing Platform Stats...")
        try:
            res = await client.get(f"{API_BASE}/super/statistics", headers={"x-super-token": SUPER_TOKEN})
            if res.status_code != 200:
                 print(f"FAILED: {res.status_code} - {res.text}")
            else:
                 stats = res.json()
                 print(f"SUCCESS: {stats}")
        except Exception as e:
             print(f"ERROR: {e}")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_super_admin())
