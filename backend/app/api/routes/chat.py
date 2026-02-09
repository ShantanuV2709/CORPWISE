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
    conversation_id: str
    question: str = Field(..., min_length=1)
    language: str="en"


# ============================
# Chat Endpoint
# ============================
@router.post("")  # ✅ NO trailing slash
@limiter.limit("5/minute")
async def chat(request: Request, payload: ChatRequest):
    # Extract Company ID from headers
    company_id = request.headers.get("X-Company-ID", None)
    
    # Extract User ID from headers (Multi-User Support)
    # Priority: Header -> Payload
    header_user_id = request.headers.get("X-User-ID")
    final_user_id = header_user_id if header_user_id else payload.user_id

    print(f"📥 API /chat | Headers: {request.headers}")
    print(f"📥 API /chat | Extracted X-Company-ID: '{company_id}'")
    print(f"👤 API /chat | User ID: '{final_user_id}' (Header: {header_user_id})")

    response = await process_chat(
        user_id=final_user_id,
        conversation_id=payload.conversation_id,
        question=payload.question,
        company_id=company_id  # Pass to orchestrator
    )
    return response
