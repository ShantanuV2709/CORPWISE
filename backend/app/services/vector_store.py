from backend.app.db.pinecone_client import get_index
from app.services.embeddings import embed_text

index = get_index()

async def upsert_document(doc_id: str, text: str, metadata: dict):
    vector = embed_text(text)
    index.upsert([
        (doc_id, vector, metadata)
    ])
