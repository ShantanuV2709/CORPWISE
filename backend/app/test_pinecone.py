from backend.app.db.pinecone_client import get_index

index = get_index()
stats = index.describe_index_stats()
print(stats)
