from sentence_transformers import SentenceTransformer
from datetime import datetime

from app.db.mongodb import db
from app.services.hash import sha256_hash

# ============================
# Model (loaded once)
# ============================
model = SentenceTransformer("intfloat/multilingual-e5-large")

# ============================
# MongoDB collection
# ============================
embedding_cache = db.embedding_cache


# =====================================================
# Async embedding with cache (CORRECT)
# =====================================================
async def embed_text(text: str) -> list[float]:
    text_hash = sha256_hash(text)

    cached = await embedding_cache.find_one({"text_hash": text_hash})
    if cached:
        return cached["embedding"]

    embedding = model.encode(
        text,
        normalize_embeddings=True
    ).tolist()

    await embedding_cache.insert_one({
        "text_hash": text_hash,
        "text": text,
        "embedding": embedding,
        "created_at": datetime.utcnow()
    })

    return embedding
