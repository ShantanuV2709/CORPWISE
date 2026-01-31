from fastapi import APIRouter
from app.db.mongodb import db

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("/{user_id}")
async def get_conversations(user_id: str):
    cursor = db.conversations.find({"user_id": user_id}, {"_id": 0})
    return await cursor.to_list(length=50)
