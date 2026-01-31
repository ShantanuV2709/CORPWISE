# Hybrid Retrieval in CORPWISE

## Overview
CORPWISE uses a hybrid retrieval strategy combining semantic and keyword-based search.

## Semantic Retrieval (Pinecone)
- Text is embedded using <embedding model>
- Query embeddings are generated at runtime
- Pinecone is used to retrieve top-k semantically similar chunks

## Keyword Retrieval (MongoDB)
- MongoDB $text indexes are used
- Keyword matches help catch exact terms and identifiers

## Score Fusion
- Semantic scores are normalized
- Keyword scores are normalized
- Weighted fusion is applied (semantic > keyword)

## Cross-Encoder Re-Ranking
- Top candidates are reranked using a cross-encoder
- Low-confidence results are rejected

## Final Context Selection
- Only top 3 chunks are passed to the LLM
