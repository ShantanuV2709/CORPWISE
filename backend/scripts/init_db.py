import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Add backend root to path
backend_root = Path(__file__).parent.parent
sys.path.append(str(backend_root))

load_dotenv(backend_root / ".env")

from app.db.mongodb import db

async def init_db():
    print("🛠️  INITIALIZING DATABASE SCHEMAS...")

    # -------------------------------------------------
    # 1. Documents Collection
    # -------------------------------------------------
    print("   [Documents]")
    if "documents" not in await db.list_collection_names():
        await db.create_collection("documents")
        print("   - Created collection 'documents'")
    
    # Indexes
    # (No unique index needed on filename if we allow duplicates, but let's index doc_type)
    await db.documents.create_index("doc_type")
    await db.documents.create_index("status")
    print("   - Created indexes for 'documents'")

    # -------------------------------------------------
    # 2. Response Cache
    # -------------------------------------------------
    print("\n   [Response Cache]")
    if "response_cache" not in await db.list_collection_names():
        await db.create_collection("response_cache")
        print("   - Created collection 'response_cache'")

    # Critical for cache lookup speed
    await db.response_cache.create_index("question_hash", unique=True)
    # TTL Index (optional, keeping items for 30 days) - 2592000 seconds
    await db.response_cache.create_index("created_at", expireAfterSeconds=2592000)
    print("   - Created indexes (Hash + 30d TTL) for 'response_cache'")

    # -------------------------------------------------
    # 3. Conversations
    # -------------------------------------------------
    print("\n   [Conversations]")
    if "conversations" not in await db.list_collection_names():
        await db.create_collection("conversations")
        print("   - Created collection 'conversations'")

    await db.conversations.create_index("conversation_id", unique=True)
    await db.conversations.create_index("updated_at")
    await db.conversations.create_index("user_id")
    print("   - Created indexes for 'conversations'")

    # -------------------------------------------------
    # 5. Internal Documents (Keyword Search)
    # -------------------------------------------------
    print("\n   [Internal Documents]")
    if "internal_documents" not in await db.list_collection_names():
        await db.create_collection("internal_documents")
        print("   - Created collection 'internal_documents'")

    # Text Index is REQUIRED for $text search
    from pymongo import TEXT
    await db.internal_documents.create_index([("text", TEXT)])
    print("   - Created TEXT index for 'internal_documents'")
    
    # -------------------------------------------------
    # 6. Feedback / Negative Logs
    # -------------------------------------------------
    print("\n   [Feedback Logs]")
    if "negative_retrieval_logs" not in await db.list_collection_names():
        await db.create_collection("negative_retrieval_logs")
    
    await db.negative_retrieval_logs.create_index("timestamp")

    print("\n✅ DATABASE INITIALIZATION COMPLETE.")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(init_db())
