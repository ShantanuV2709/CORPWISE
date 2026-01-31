from fastapi import APIRouter
from app.db.mongodb import db

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/info")
async def get_system_info():
    doc = await db.system_info.find_one({"_id": "corpwise"}, {"_id": 0})
    return doc
