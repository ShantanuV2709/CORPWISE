# app/test_retrieval.py
from backend.app.db.pinecone_client import get_index
from app.services.embeddings import embed_text

index = get_index()

query = "What is CORPWISE?"
vector = embed_text(query)

res = index.query(
    vector=vector,
    top_k=3,
    include_metadata=True
)

for match in res["matches"]:
    print(match["score"], match["metadata"]["title"])
