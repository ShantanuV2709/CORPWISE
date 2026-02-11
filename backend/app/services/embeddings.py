from sentence_transformers import SentenceTransformer
from datetime import datetime
import time
from typing import Dict

from app.db.mongodb import db
from app.services.hash import sha256_hash

# ============================
# Multi-Model Support (lazy loaded)
# ============================
_models: Dict[int, SentenceTransformer] = {}

# Model mapping by dimension
MODEL_MAP = {
    384: "all-MiniLM-L6-v2",           # Starter: 90MB, fast
    768: "BAAI/bge-base-en-v1.5",      # Professional: 420MB, balanced
    1024: "BAAI/bge-large-en-v1.5"     # Enterprise: 1.3GB, best quality
}

def get_model(dimensions: int = 384) -> SentenceTransformer:
    """
    Lazy load the embedding model for specified dimensions.
    
    Args:
        dimensions: Vector dimensions (384, 768, or 1024)
    
    Returns:
        SentenceTransformer model
    """
    global _models
    
    if dimensions not in MODEL_MAP:
        raise ValueError(f"Invalid dimensions: {dimensions}. Must be 384, 768, or 1024")
    
    if dimensions not in _models:
        model_name = MODEL_MAP[dimensions]
        print(f"📦 Loading {dimensions}-dim model: {model_name} (first time)...")
        
        size_info = {
            384: "~90MB - Takes 5-15 seconds",
            768: "~420MB - Takes 15-30 seconds", 
            1024: "~1.3GB - Takes 30-60 seconds"
        }
        
        print(f"⏳ Downloading/Loading {size_info[dimensions]}...")
        print("💡 TIP: Model stays in memory for future uploads")
        
        start_time = time.time()
        _models[dimensions] = SentenceTransformer(model_name)
        elapsed = time.time() - start_time
        
        print(f"✅ {dimensions}-dim model loaded in {elapsed:.1f}s!")
        print("🚀 Ready to process documents")
    
    return _models[dimensions]

# ============================
# MongoDB collection
# ============================
embedding_cache = db.embedding_cache


# =====================================================
# Async embedding with cache
# =====================================================
async def embed_text(text: str, dimensions: int = 384) -> list[float]:
    """
    Generate embedding for text using specified dimension model.
    
    Args:
        text: Text to embed
        dimensions: Vector dimensions (384, 768, or 1024)
    
    Returns:
        List of floats representing the embedding
    """
    # Create hash including dimensions to separate cache entries
    cache_key = f"{sha256_hash(text)}_{dimensions}"
    
    cached = await embedding_cache.find_one({"cache_key": cache_key})
    if cached:
        return cached["embedding"]
    
    # Get appropriate model and generate embedding
    model = get_model(dimensions)
    embedding = model.encode(
        text,
        normalize_embeddings=True
    ).tolist()
    
    # Cache the embedding
    await embedding_cache.insert_one({
        "cache_key": cache_key,
        "text_hash": sha256_hash(text),
        "text": text,
        "embedding": embedding,
        "dimensions": dimensions,
        "model": MODEL_MAP[dimensions],
        "created_at": datetime.utcnow()
    })
    
    return embedding
