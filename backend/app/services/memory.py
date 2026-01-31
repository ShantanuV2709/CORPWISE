from app.db.mongodb import db

async def get_recent_messages(user_id: str, limit: int = 5):
    convo = await db.conversations.find_one(
        {"user_id": user_id},
        {"messages": {"$slice": -limit}, "_id": 0}
    )
    return convo["messages"] if convo else []
