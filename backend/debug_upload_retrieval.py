"""
Debug script to test document retrieval
"""
import asyncio
from app.services.chat_orchestrator import process_chat

async def test_retrieval():
    # Test query about uploaded content
    test_query = "What is this document about?"
    
    print("=" * 60)
    print(f"Testing query: {test_query}")
    print("=" * 60)
    
    result = await process_chat(
        question=test_query,
        user_id="test_user",
        conversation_id="test_conv"
    )
    
    print("\n📊 RESULT:")
    print(f"Reply: {result['reply']}")
    print(f"\n📄 Sources: {result.get('sources', [])}")
    print(f"Confidence: {result.get('confidence', 'unknown')}")
    print(f"Cached: {result.get('cached', False)}")

if __name__ == "__main__":
    asyncio.run(test_retrieval())
