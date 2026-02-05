import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

backend_root = Path(__file__).parent.parent
sys.path.append(str(backend_root))

load_dotenv(backend_root / ".env")

from app.db.pinecone_client import get_index

def wipe_pinecone():
    print("🧹 Wiping Pinecone Index...")
    try:
        index = get_index()
        # Delete everything in default namespace
        index.delete(delete_all=True)
        # Delete everything in explicit empty namespace (just in case)
        try:
            index.delete(delete_all=True, namespace="")
        except Exception:
            pass
            
        print("✅ Pinecone Index successfully wiped.")
    except Exception as e:
        print(f"❌ Error wiping Pinecone: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    wipe_pinecone()
