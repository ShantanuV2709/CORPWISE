from app.db.mongodb import db

async def get_recent_messages(conversation_id: str, limit: int = 5):
    convo = await db.conversations.find_one(
        {"conversation_id": conversation_id},
        {"messages": {"$slice": -limit}, "_id": 0}
    )
    return convo["messages"] if convo else []
