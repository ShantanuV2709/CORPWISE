import os
from dotenv import load_dotenv
from pinecone import Pinecone
from typing import Dict

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

# Index names for each dimension tier
INDEX_NAMES: Dict[int, str] = {
    384: os.getenv("PINECONE_INDEX_384", "corpwise-384"),
    768: os.getenv("PINECONE_INDEX_768", "corpwise-768"),
    1024: os.getenv("PINECONE_INDEX_1024", "corpwise-index")
}

if not PINECONE_API_KEY:
    raise RuntimeError("PINECONE_API_KEY is not set")

pc = Pinecone(api_key=PINECONE_API_KEY)

# Cache for index connections
_index_cache: Dict[int, any] = {}


def get_index(dimensions: int = 384):
    """
    Get Pinecone index for specified dimensions.
    
    Args:
        dimensions: Vector dimensions (384, 768, or 1024)
    
    Returns:
        Pinecone Index instance
    """
    if dimensions not in INDEX_NAMES:
        raise ValueError(f"Invalid dimensions: {dimensions}. Must be 384, 768, or 1024")
    
    # Return cached index if available
    if dimensions in _index_cache:
        return _index_cache[dimensions]
    
    index_name = INDEX_NAMES[dimensions]
    index = pc.Index(index_name)
    
    # Cache the index
    _index_cache[dimensions] = index
    
    print(f"📌 Connected to Pinecone index: {index_name} ({dimensions} dims)")
    
    return index


def get_index_name(dimensions: int) -> str:
    """Get the index name for specified dimensions."""
    if dimensions not in INDEX_NAMES:
        raise ValueError(f"Invalid dimensions: {dimensions}")
    return INDEX_NAMES[dimensions]
