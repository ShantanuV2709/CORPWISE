from app.db.mongodb import db

async def get_system_answer():
    doc = await db.system_info.find_one({})

    if not doc:
        return (
            "CORPWISE is a cutting-edge AI assistant designed to bridge the gap "
            "between your employees and your corporate knowledge base. "
            "It uses Retrieval Augmented Generation (RAG) to allow you to chat "
            "with internal documents—HR policies, technical guides, and project archives—"
            "just as you would with a colleague. Key features include hybrid search, "
            "source citations, and enterprise-grade security."
        )

    return f"{doc['name']} is {doc['description']}"
