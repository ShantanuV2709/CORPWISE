from backend.app.db.pinecone_client import get_index
from app.services.embeddings import embed_text

index = get_index()

async def retrieve_context(query: str, top_k: int = 5) -> str:
    query_vector = embed_text(query)

    results = index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True
    )

    contexts = [
        match["metadata"]["text"]
        for match in results["matches"]
        if "text" in match["metadata"]
    ]

    return "\n".join(contexts)
