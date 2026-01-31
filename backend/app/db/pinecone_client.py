import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()  # 👈 THIS IS THE FIX

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "corpwise-index"

if not PINECONE_API_KEY:
    raise RuntimeError("PINECONE_API_KEY is not set")

pc = Pinecone(api_key=PINECONE_API_KEY)

def get_index():
    return pc.Index(INDEX_NAME)
