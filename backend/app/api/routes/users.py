from fastapi import APIRouter
from app.db.mongodb import db

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"_id": user_id}, {"_id": 0})
    if not user:
        return {"error": "User not found"}
    return user
