"""
Document Processing Service
Handles chunking, embedding, and indexing of uploaded documents.
"""
import uuid
from pathlib import Path
from typing import List, Dict

from app.services.embeddings import embed_text
from app.db.pinecone_client import get_index

# Configuration
CHUNK_SIZE = 400
OVERLAP = 50


def split_markdown_by_section(text: str) -> List[tuple]:
    """Split markdown text into (section_title, section_body) tuples."""
    sections = []
    current_section = "overview"
    buffer = []

    for line in text.splitlines():
        line = line.strip()
        if line.startswith("#"):
            if buffer:
                sections.append((current_section, "\n".join(buffer).strip()))
                buffer = []
            current_section = line.lstrip("#").strip().lower()
        else:
            buffer.append(line)

    if buffer:
        sections.append((current_section, "\n".join(buffer).strip()))

    return [(s, b) for s, b in sections if b]


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> List[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks


async def process_and_index_document(
    file_path: str,
    doc_id: str,
    doc_type: str,
    filename: str
) -> Dict:
    """
    Process a document file and index it to Pinecone.
    
    Args:
        file_path: Path to the document file
        doc_id: Unique document ID
        doc_type: Document category (e.g., 'hr', 'it', 'policy')
        filename: Original filename
        
    Returns:
        Dict with processing results
    """
    # Read file content
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Split into sections (works for markdown and plain text)
    sections = split_markdown_by_section(content)
    
    # Process each section
    index = get_index()
    pinecone_ids = []
    total_chunks = 0
    
    for section_title, section_body in sections:
        chunks = chunk_text(section_body)
        
        for i, chunk_text_content in enumerate(chunks):
            # Generate embedding
            embedding = await embed_text(chunk_text_content)
            
            # Create unique ID
            chunk_id = f"{doc_id}__{section_title}__{i}"
            pinecone_ids.append(chunk_id)
            
            # Prepare metadata
            metadata = {
                "text": chunk_text_content,
                "source": f"{doc_type}/{filename}",
                "section": section_title,
                "doc_id": doc_id,
                "doc_type": doc_type,
                "chunk_index": i
            }
            
            # Upsert to Pinecone
            index.upsert(
                vectors=[(chunk_id, embedding, metadata)],
                namespace=""
            )
            
            total_chunks += 1
    
    return {
        "chunk_count": total_chunks,
        "pinecone_ids": pinecone_ids,
        "status": "indexed"
    }


async def delete_document_from_index(pinecone_ids: List[str]):
    """Remove document chunks from Pinecone."""
    if not pinecone_ids:
        return
    
    index = get_index()
    index.delete(ids=pinecone_ids, namespace="")
