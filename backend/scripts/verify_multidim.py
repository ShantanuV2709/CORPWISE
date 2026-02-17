
import asyncio
import httpx
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from app.db.mongodb import db
from app.db.pinecone_client import get_index

BASE_URL = "http://localhost:8001"


def log(msg):
    print(msg)
    with open("multidim_verification_log.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")

async def test_multidim_architecture():
    # Clear previous log
    with open("multidim_verification_log.txt", "w", encoding="utf-8") as f:
        f.write("🧪 Multi-Dimension Verification Log\n")
        f.write("=================================\n\n")

    log("🧪 Starting Multi-Dimension Architecture Verification...")
    
    # Test Cases
    tests = [
        {
            "name": "Starter Tier",
            "company_id": "multidim-starter-test",
            "tier": "starter",
            "expected_dims": 384
        },
        {
            "name": "Professional Tier",
            "company_id": "multidim-pro-test",
            "tier": "professional",
            "expected_dims": 768
        }
    ]

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=300.0) as client:
        for test in tests:
            log(f"\n------------------------------------------------")
            log(f"🔹 Testing {test['name']} ({test['tier']} -> {test['expected_dims']} dims)")
            log(f"------------------------------------------------")
            
            # 1. Setup Company in DB
            company_id = test["company_id"]
            await db.admins.update_one(
                {"company_id": company_id},
                {"$set": {
                    "company_id": company_id,
                    "subscription_tier": test["tier"],
                    "subscription_status": "active",
                    "email": f"test-{test['tier']}@corpwise.ai",
                    "api_keys": [],
                    "usage": {"queries_this_month": 0, "documents_count": 0}
                }},
                upsert=True
            )
            log(f"✅ Created/Updated company {company_id}")

            # 2. Upload Document
            filename = f"test_doc_{test['tier']}.txt"
            content = f"This is a test document for {test['name']} to verify vector dimensions of {test['expected_dims']}."
            
            # Create dummy file
            with open(filename, "w") as f:
                f.write(content)
                
            try:
                with open(filename, "rb") as f:
                    response = await client.post(
                        "/admin/documents/upload",
                        files={"file": (filename, f, "text/plain")},
                        headers={"X-Company-ID": company_id}
                    )
                
                if response.status_code != 200:
                    log(f"❌ Upload failed: {response.text}")
                    continue
                    
                doc_data = response.json()
                doc_id = doc_data["doc_id"]
                log(f"✅ Uploaded document: {doc_id}")
                
            finally:
                if os.path.exists(filename):
                    os.remove(filename)

            # 3. Verify MongoDB Record
            doc_record = await db.documents.find_one({"_id": doc_id})
            if not doc_record:
                log("❌ Document record not found in MongoDB")
                continue
                
            actual_dims = doc_record.get("dimensions")
            if actual_dims == test['expected_dims']:
                log(f"✅ MongoDB 'dimensions' field matches: {actual_dims}")
            else:
                log(f"❌ MongoDB dimensions mismatch! Expected {test['expected_dims']}, got {actual_dims}")

            # 4. Verify Pinecone Index Stats (Mock or Real check)
            # We will use the pinecone_client to get the index and check stats
            try:
                index = get_index(test['expected_dims'])
                stats = index.describe_index_stats()
                
                # Check if namespace exists (company_id is namespace)
                namespaces = stats.get("namespaces", {})
                if company_id in namespaces:
                    vector_count = namespaces[company_id]["vector_count"]
                    log(f"✅ Pinecone Namespace '{company_id}' found in correct index.")
                    log(f"   - Index Dimensions: {stats['dimension']}")
                    log(f"   - Vector Count: {vector_count}")
                    
                    if stats['dimension'] == test['expected_dims']:
                         log(f"✅ Index dimensions match expected: {test['expected_dims']}")
                    else:
                         log(f"❌ Index dimensions mismatch! Expected {test['expected_dims']}, got {stats['dimension']}")
                else:
                    log(f"⚠️ Namespace '{company_id}' not found in index yet (might be async/delayed).")
                    
            except Exception as e:
                log(f"⚠️ Could not verify Pinecone directly: {e}")

            # 5. Test Retrieval (Optional but recommended)
            query_response = await client.post(
                "/admin/search_debug",
                json={"query": "test document validation", "top_k": 1},
                headers={"X-Company-ID": company_id}
            )
            
            if query_response.status_code == 200:
                results = query_response.json()["results"]
                if results and len(results) > 0:
                     log(f"✅ Retrieval successful! Found {len(results)} matches.")
                     log(f"   - Top Score: {results[0]['score']}")
                else:
                     log("⚠️ Retrieval returned 0 results.")
            else:
                log(f"❌ Retrieval failed: {query_response.text}")

    log("\n------------------------------------------------")
    log("🏁 Verification Complete")
    log("------------------------------------------------")


if __name__ == "__main__":
    asyncio.run(test_multidim_architecture())
