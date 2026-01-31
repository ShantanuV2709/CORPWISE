from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.core.rate_limit import limiter
from app.services.chat_orchestrator import process_chat

router = APIRouter(prefix="/chat", tags=["Chat"])


# ============================
# Request Schema
# ============================
class ChatRequest(BaseModel):
    user_id: str
    question: str = Field(..., min_length=1)
    language: str="en"


# ============================
# Chat Endpoint
# ============================
@router.post("")  # ✅ NO trailing slash
@limiter.limit("5/minute")
async def chat(request: Request, payload: ChatRequest):
    response = await process_chat(
        user_id=payload.user_id,
        question=payload.question
    )
    return response
