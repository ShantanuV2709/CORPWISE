"""
Simple Pinecone check
"""
import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("corpwise")

# Get index stats
stats = index.describe_index_stats()
print("=" * 60)
print("PINECONE INDEX STATS:")
print("=" * 60)
print(f"Total vectors: {stats.total_vector_count}")
print(f"Namespaces: {stats.namespaces}")

# Try to query for uploaded documents
print("\n" + "=" * 60)
print("SEARCHING FOR UPLOADED DOCUMENTS:")
print("=" * 60)

# Query with a simple vector to see what's there
results = index.query(
    vector=[0.1] * 768,  # Dummy vector
    top_k=10,
    include_metadata=True,
    filter={"doc_type": "general"}  # Look for uploaded docs
)

print(f"\nFound {len(results.matches)} results with doc_type='general':")
for match in results.matches:
    print(f"\nID: {match.id}")
    print(f"Score: {match.score}")
    print(f"Source: {match.metadata.get('source', 'N/A')}")
    print(f"Doc Type: {match.metadata.get('doc_type', 'N/A')}")
    print(f"Text preview: {match.metadata.get('text', '')[:100]}...")
