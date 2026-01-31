"""
Debug retrieval for CEO query
"""
import asyncio
import sys
sys.path.append('.')

from app.services.chat_orchestrator import retrieve_context, restrict_chunks_by_intent
from app.services.intent import detect_intent

async def debug_ceo_query():
    query = "Who's the CEO of the company?"
    
    print("=" * 60)
    print(f"Query: {query}")
    print("=" * 60)
    
    # Detect intent
    intent = detect_intent(query)
    print(f"\nDetected Intent: {intent}")
    
    # Retrieve context
    context, sources, chunks, ce_used = await retrieve_context(query, top_k=10)
    
    print(f"\nTotal chunks retrieved: {len(chunks)}")
    print(f"Cross-encoder used: {ce_used}")
    
    print("\n" + "=" * 60)
    print("CHUNKS BEFORE INTENT FILTERING:")
    print("=" * 60)
    for i, chunk in enumerate(chunks):
        print(f"\n#{i+1}")
        print(f"Source: {chunk['source']}")
        print(f"Score: {chunk.get('norm_score', chunk.get('score', 'N/A'))}")
        print(f"CE Score: {chunk.get('ce_score', 'N/A')}")
        print(f"Text preview: {chunk['text'][:150]}...")
    
    # Apply intent filtering
    filtered = restrict_chunks_by_intent(chunks, intent)
    
    print("\n" + "=" * 60)
    print(f"CHUNKS AFTER INTENT FILTERING ({intent}):")
    print("=" * 60)
    print(f"Filtered to {len(filtered)} chunks")
    
    for i, chunk in enumerate(filtered):
        print(f"\n#{i+1}")
        print(f"Source: {chunk['source']}")
        print(f"Score: {chunk.get('norm_score', chunk.get('score', 'N/A'))}")
        print(f"CE Score: {chunk.get('ce_score', 'N/A')}")
        print(f"Text preview: {chunk['text'][:150]}...")
    
    print("\n" + "=" * 60)
    print(f"FINAL SOURCES USED:")
    print("=" * 60)
    for source in sources:
        print(f"  - {source}")

if __name__ == "__main__":
    asyncio.run(debug_ceo_query())
