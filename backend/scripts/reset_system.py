import sys
import asyncio
from pathlib import Path
import os
from dotenv import load_dotenv

# Add backend root to path so we can import app modules
backend_root = Path(__file__).parent.parent
sys.path.append(str(backend_root))

# Load env vars for DB connections
load_dotenv(backend_root / ".env")

from app.db.mongodb import db
from app.db.pinecone_client import get_index

async def reset_system():
    print("🗑️  INITIALIZING SYSTEM RESET...")
    print("   Target: MongoDB, Pinecone, Local Files")
    
    # -------------------------------------------------
    # 1. MongoDB Cleanup
    # -------------------------------------------------
    print("\n[1/3] Cleaning MongoDB...")
    try:
        collections = await db.list_collection_names()
        for col in collections:
            # Skip system collections if any (usually starts with system.)
            if col.startswith("system."):
                continue
                
            await db[col].drop()
            print(f"   - Dropped collection: {col}")
            
        print("   ✅ MongoDB cleared.")
    except Exception as e:
        print(f"   ❌ MongoDB Error: {e}")

    # -------------------------------------------------
    # 2. Pinecone Cleanup
    # -------------------------------------------------
    print("\n[2/3] Cleaning Pinecone Vector DB...")
    try:
        index = get_index()
        # Delete all vectors in the default namespace
        index.delete(delete_all=True) # Default namespace
        # Also check other namespaces? Usually "" is default.
        index.delete(delete_all=True, namespace="") 
        print("   - Deleted all vectors from index.")
        print("   ✅ Pinecone cleared.")
    except Exception as e:
        print(f"   ❌ Pinecone Error: {e}")

    # -------------------------------------------------
    # 3. File Cleanup
    # -------------------------------------------------
    print("\n[3/3] Deleting Local Files...")
    
    # Directories to clean
    dirs_to_clean = [
        backend_root / "uploads",
        backend_root / "documents",
    ]
    
    for dir_path in dirs_to_clean:
        if not dir_path.exists():
            continue
            
        print(f"   Cleaning {dir_path.name}...")
        for item in dir_path.glob("**/*"):
            if item.is_file():
                if item.name == ".gitkeep":
                    continue
                try:
                    item.unlink()
                    print(f"   - Deleted: {item.relative_to(backend_root)}")
                except Exception as e:
                    print(f"   - Failed to delete {item.name}: {e}")
            elif item.is_dir():
                # We can remove subdirectories if empty, but glob matches files primarily.
                # To clean fully recursive:
                pass

    # Double check recursive removal
    import shutil
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            for item in dir_path.iterdir():
                if item.is_file() and item.name != ".gitkeep":
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            print(f"   ✅ Cleared {dir_path.name}/")

    print("\n✨ SYSTEM RESET COMPLETE ✨")
    print("You can now start fresh.")

if __name__ == "__main__":
    # Windows SelectorPolicy fix for asyncio
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(reset_system())
