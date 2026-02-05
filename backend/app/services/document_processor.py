"""
Document Processing Service
Handles chunking, embedding, and indexing of uploaded documents.
"""

from datetime import datetime
import uuid
from pathlib import Path
from typing import List, Dict

from app.services.embeddings import embed_text
from app.db.pinecone_client import get_index
from app.db.mongodb import db

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
    """
    Split text into overlapping chunks while PRESERVING newlines.
    We split by characters/lines to keep list formatting intact.
    """
    if not text:
        return []

    # Simple character-based sliding window that tries to respect line breaks
    chunks = []
    start = 0
    text_len = len(text)

    # Convert word-count chunk_size to rough character count (assuming ~6 chars/word)
    # This keeps it properly sized for embedding models
    CHAR_CHUNK_SIZE = chunk_size * 6 
    CHAR_OVERLAP = overlap * 6

    while start < text_len:
        end = start + CHAR_CHUNK_SIZE
        
        # If we are not at the end of text, try to find a nice break point (newline or space)
        if end < text_len:
            # Look for last newline in the window
            last_newline = text.rfind('\n', start, end)
            if last_newline != -1 and last_newline > start + (CHAR_CHUNK_SIZE // 2):
                end = last_newline + 1
            else:
                # Fallback to last space
                last_space = text.rfind(' ', start, end)
                if last_space != -1:
                    end = last_space + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - CHAR_OVERLAP
        # Ensure progress
        if start >= end:
            start = end
            
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
    content = ""
    if filename.lower().endswith(".pdf"):
        # PDF Parsing
        try:
            from pydantic import ValidationError
            from pypdf import PdfReader
            
            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                text_parts.append(page.extract_text() or "")
            content = "\n".join(text_parts)
            
            # If PDF is just images (scanned), this might be empty.
            if not content.strip():
                return {"status": "failed", "message": "Empty or scanned PDF (OCR not supported yet)"}
                
        except Exception as e:
            return {"status": "failed", "message": f"PDF Error: {str(e)}"}
            
    else:
        # Markdown/Text Parsing
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    
    # Split into sections (works for markdown and plain text)
    if filename.lower().endswith(".md"):
        sections = split_markdown_by_section(content)
    else:
        # Treat other files (TXT, PDF) as one big 'content' section or crude splitting
        # For simplicity, treat as one section named "General"
        sections = [("General Content", content)]
    
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

            # Insert into MongoDB for Keyword Search (Hybrid RAG)
            await db.internal_documents.insert_one({
                "doc_id": doc_id,
                "chunk_id": chunk_id,
                "text": chunk_text_content,
                "source": metadata["source"],
                "section": section_title,
                "doc_type": doc_type,
                "created_at": datetime.utcnow()
            })
            
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
