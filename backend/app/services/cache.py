from datetime import datetime
from app.db.mongodb import db
from app.services.hash import sha256_hash

response_cache = db.response_cache


# =====================================================
# Get cached response (ASYNC)
# =====================================================
async def get_cached_response(question: str):
    q_hash = sha256_hash(question)

    cached = await response_cache.find_one({"question_hash": q_hash})
    if not cached:
        return None

    await response_cache.update_one(
        {"_id": cached["_id"]},
        {"$inc": {"hit_count": 1}}
    )

    return cached


# =====================================================
# Store response (ASYNC)
# =====================================================
async def store_response(question, answer, sources, confidence):
    if not answer or "temporarily unable" in answer.lower():
        return

    await response_cache.insert_one({
        "question_hash": sha256_hash(question),
        "question": question,
        "answer": answer,
        "sources": sources,
        "confidence": confidence,
        "hit_count": 1,
        "created_at": datetime.utcnow()
    })
