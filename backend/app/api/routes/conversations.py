from fastapi import APIRouter, Request, HTTPException
from app.db.mongodb import db

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("/history")
async def get_conversations(request: Request):
    """
    Get conversation history for the authenticated user.
    User ID is extracted from X-User-ID header.
    """
    user_id = request.headers.get("X-User-ID")
    
    if not user_id:
        # Fallback to query param if needed, or strict error
        # For "just like multi-tenant", strict header is better, 
        # but let's check for query param for backward compat if frontend mistakenly sends it?
        # Actually, let's enforce header to be clean.
        raise HTTPException(status_code=400, detail="X-User-ID header is required")

    cursor = db.conversations.find({"user_id": user_id}, {"_id": 0})
    return await cursor.to_list(length=50)
