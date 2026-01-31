"""
Check if uploaded documents are fully ingested to Pinecone
"""
import asyncio
from app.models.document import DocumentModel
from app.db.pinecone_client import get_index

async def verify_document_ingestion():
    """Check all uploaded documents and verify chunk counts."""
    
    # Get all uploaded documents from MongoDB
    documents = await DocumentModel.get_all()
    
    if not documents:
        print("❌ No documents found in MongoDB")
        return
    
    print(f"📁 Found {len(documents)} uploaded document(s)\n")
    print("=" * 80)
    
    index = get_index()
    
    for doc in documents:
        doc_id = doc["_id"]
        filename = doc["filename"]
        expected_chunks = doc.get("chunk_count", 0)
        status = doc.get("status", "unknown")
        
        print(f"\n📄 Document: {filename}")
        print(f"   Doc ID: {doc_id}")
        print(f"   Status: {status}")
        print(f"   Expected chunks: {expected_chunks}")
        
        # Query Pinecone for chunks with this doc_id
        # We need to fetch with a dummy vector and filter by doc_id
        try:
            # Get index stats to see total vectors
            stats = index.describe_index_stats()
            total_vectors = stats.total_vector_count
            
            print(f"   Total vectors in Pinecone: {total_vectors}")
            
            # Try to query for this specific doc_id
            # (This is a workaround since Pinecone doesn't have a direct "count by metadata" API)
            results = index.query(
                vector=[0.1] * 768,  # Dummy vector
                top_k=100,  # Get up to 100 chunks
                include_metadata=True,
                filter={"doc_id": doc_id}
            )
            
            actual_chunks = len(results.matches)
            
            print(f"   Actual chunks in Pinecone: {actual_chunks}")
            
            if actual_chunks == expected_chunks:
                print(f"   ✅ STATUS: Fully ingested!")
            elif actual_chunks > 0:
                print(f"   ⚠️  STATUS: Partial ingestion ({actual_chunks}/{expected_chunks})")
            else:
                print(f"   ❌ STATUS: Not found in Pinecone!")
            
            # Show sample chunks
            if results.matches:
                print(f"\n   Sample chunks:")
                for i, match in enumerate(results.matches[:3]):
                    source = match.metadata.get("source", "N/A")
                    section = match.metadata.get("section", "N/A")
                    text_preview = match.metadata.get("text", "")[:80]
                    print(f"      {i+1}. Source: {source}")
                    print(f"         Section: {section}")
                    print(f"         Text: {text_preview}...")
        
        except Exception as e:
            print(f"   ❌ Error querying Pinecone: {e}")
        
        print("-" * 80)

if __name__ == "__main__":
    asyncio.run(verify_document_ingestion())
