from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.core.rate_limit import limiter
from app.core.usage_middleware import check_usage_limits
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

    # Validating API Key if present (Security Layer)
    api_key = request.headers.get("X-API-Key", None)
    
    if api_key:
        if not company_id:
             from fastapi import HTTPException
             raise HTTPException(status_code=400, detail="X-Company-ID header required with API Key")
        
        from app.core.security import verify_api_key
        valid_key = await verify_api_key(api_key, company_id)
        
        if not valid_key:
             from fastapi import HTTPException
             raise HTTPException(status_code=401, detail="Invalid API Key")
        
        print(f"🔑 API Key Verified: {valid_key.get('name', 'Unknown')}")

    # Check usage limits if company_id is provided
    if company_id:
        await check_usage_limits(request, company_id, action="query")

    response = await process_chat(
        user_id=final_user_id,
        conversation_id=payload.conversation_id,
        question=payload.question,
        company_id=company_id  # Pass to orchestrator
    )
    return response
