from app.services.embeddings import embed_text

q = embed_text("What is CORPWISE?", is_query=True)
p = embed_text("CORPWISE is an enterprise AI platform.", is_query=False)

print(len(q), len(p))
print(q[:5])
print(p[:5])
