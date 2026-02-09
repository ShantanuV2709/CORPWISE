from fastapi import APIRouter
from pydantic import BaseModel
from app.db.mongodb import db
from app.services.cache import store_response

router = APIRouter(prefix="/feedback", tags=["Feedback"])

class FeedbackRequest(BaseModel):
    conversation_id: str
    helpful: bool
    reason: str = None

@router.post("")
async def submit_feedback(payload: FeedbackRequest):
    # If helpful, we want to cache the last interaction
    if payload.helpful:
        # 1. Fetch conversation history
        conversation = await db.conversations.find_one({"user_id": payload.conversation_id})
        
        if conversation and "messages" in conversation:
            messages = conversation["messages"]
            # We need at least one Q/A pair
            if len(messages) >= 2:
                # Assuming last is Assistant, second to last is User
                last_msg = messages[-1]
                prev_msg = messages[-2]
                
                if last_msg["role"] == "assistant" and prev_msg["role"] == "user":
                    question = prev_msg["content"]
                    answer = last_msg["content"]
                    
                    # We can't easily recover exact sources/confidence here without storing them in msg meta
                    # But assuming high confidence since user liked it.
                    # Ideally, message history should store metadata. 
                    # Let's check if we can retrieve it safely, otherwise empty list.
                    sources = [] 
                    confidence = "high" # User validated it!
                    company_id = conversation.get("company_id") # Get isolated tenant ID

                    await store_response(
                        question=question,
                        answer=answer,
                        sources=sources,
                        confidence=confidence,
                        company_id=company_id
                    )
                    
                    return {"status": "cached", "message": "Response cached via feedback."}

    return {"status": "ok", "message": "Feedback received."}
