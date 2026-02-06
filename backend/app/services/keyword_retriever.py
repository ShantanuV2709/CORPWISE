from app.db.mongodb import db

docs = db.internal_documents



async def keyword_search(query: str, company_id: str = None, limit: int = 5):
    # Base filter criteria
    filters = {"$text": {"$search": query}}
    
    # If company_id is provided, restrict search to that company
    # If None, it defaults to global documents (company_id="")
    # Note: We must match how we inserted it.
    target_company = company_id if company_id else "" 
    filters["company_id"] = target_company
    
    print(f"🔍 KEYWORD SEARCH | Company: '{company_id}' | Target: '{target_company}' | Query: {query}")
    print(f"🔍 MONGODB FILTER: {filters}")

    results = await docs.find(
        filters,
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

