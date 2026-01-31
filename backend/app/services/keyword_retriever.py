from app.db.mongodb import db

docs = db.internal_documents


async def keyword_search(query: str, limit: int = 5):
    results = await docs.find(
        {"$text": {"$search": query}},
        {"score": {"$meta": "textScore"}, "text": 1, "source": 1}
    ).sort(
        [("score", {"$meta": "textScore"})]
    ).limit(limit).to_list(length=limit)

    chunks = []

    for doc in results:
        chunks.append({
            "text": doc["text"],
            "source": doc["source"],
            "section": doc.get("section"),
            "doc_id": doc.get("doc_id"),  # Extract doc_id for boost detection
            "doc_type": doc.get("doc_type"),  # Also extract doc_type
            "score": doc["score"],
            "type": "keyword"
        })

    return chunks

