from app.db.pinecone_client import get_index
from app.services.embeddings import embed_text


async def retrieve_context(
    query: str, 
    company_id: str,
    top_k: int = 5
) -> str:
    """
    Retrieve context from Pinecone using tier-specific embeddings.
    
    Args:
        query: User query
        company_id: Company ID for namespace isolation
        top_k: Number of results to retrieve
    
    Returns:
        Concatenated context from retrieved chunks
    """
    # Get company tier to determine dimensions
    from app.db.mongodb import db
    from app.models.subscription import get_tier_dimensions
    
    company = await db.admins.find_one({"company_id": company_id.lower()})
    
    # Default to starter if company not found
    dimensions = 384
    if company:
        tier = company.get("subscription_tier", "starter")
        dimensions = get_tier_dimensions(tier)
    
    # Get tier-specific index and embed query
    index = get_index(dimensions)
    query_vector = await embed_text(query, dimensions=dimensions)
    
    # Query Pinecone with namespace
    results = index.query(
        vector=query_vector,
        top_k=top_k,
        namespace=company_id.lower(),
        include_metadata=True
    )
    
    contexts = [
        match["metadata"]["text"]
        for match in results["matches"]
        if "text" in match["metadata"]
    ]
    
    return "\n".join(contexts)


async def retrieve_with_scores(
    query: str, 
    company_id: str,
    top_k: int = 5
) -> list:
    """
    Retrieve context from Pinecone with scores for debugging.
    """
    # Get company tier to determine dimensions
    from app.db.mongodb import db
    from app.models.subscription import get_tier_dimensions
    
    company = await db.admins.find_one({"company_id": company_id.lower()})
    
    # Default to starter
    dimensions = 384
    if company:
        tier = company.get("subscription_tier", "starter")
        dimensions = get_tier_dimensions(tier)
    
    # Get tier-specific index and embed query
    index = get_index(dimensions)
    query_vector = await embed_text(query, dimensions=dimensions)
    
    # Query Pinecone with namespace
    results = index.query(
        vector=query_vector,
        top_k=top_k,
        namespace=company_id.lower(),
        include_metadata=True
    )
    
    # Return raw matches
    return [
        {
            "score": match["score"],
            "text": match["metadata"].get("text", ""),
            "source": match["metadata"].get("source", "Unknown"),
            "section": match["metadata"].get("section", "General"),
            "doc_id": match["metadata"].get("doc_id", "")
        }
        for match in results["matches"]
    ]
