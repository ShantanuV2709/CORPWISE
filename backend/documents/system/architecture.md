# CORPWISE Architecture

CORPWISE follows a modular microservice-based architecture.

Core components:
- FastAPI backend for orchestration
- MongoDB for user data and conversation memory
- Pinecone vector database for semantic retrieval
- Gemini LLM for response generation

The system uses Retrieval-Augmented Generation (RAG) to ensure responses are grounded in internal documentation.
