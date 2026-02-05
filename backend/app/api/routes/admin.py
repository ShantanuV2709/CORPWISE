"""
Admin API Routes
Endpoints for document management.
"""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.models.document import DocumentModel
from app.services.document_processor import process_and_index_document, delete_document_from_index

router = APIRouter(prefix="/admin", tags=["Admin"])

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    status: str
    message: str


@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = "general"
):
    """
    Upload and process a document.
    
    Supported formats: .md, .txt
    """
    # Validate file type
    if not file.filename.lower().endswith(('.md', '.txt', '.pdf')):
        raise HTTPException(
            status_code=400,
            detail="Only .md, .txt, and .pdf files are supported"
        )
    
    # Generate unique document ID
    doc_id = str(uuid.uuid4())
    
    # Save file
    file_path = UPLOAD_DIR / f"{doc_id}_{file.filename}"
    
    try:
        # Write uploaded file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Create document record
        await DocumentModel.create(
            doc_id=doc_id,
            filename=file.filename,
            doc_type=doc_type
        )
        
        # Process and index
        result = await process_and_index_document(
            file_path=str(file_path),
            doc_id=doc_id,
            doc_type=doc_type,
            filename=file.filename
        )
        
        # Update document status
        await DocumentModel.update_status(
            doc_id=doc_id,
            status=result["status"],
            chunk_count=result["chunk_count"],
            pinecone_ids=result["pinecone_ids"]
        )
        
        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "status": "indexed",
            "message": f"Successfully indexed {result['chunk_count']} chunks"
        }
    
    except Exception as e:
        # Update status to failed
        await DocumentModel.update_status(doc_id=doc_id, status="failed")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/documents")
async def list_documents():
    """Get all uploaded documents."""
    documents = await DocumentModel.get_all()
    return {"documents": documents}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and remove from Pinecone."""
    # Get document
    doc = await DocumentModel.get_by_id(doc_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from Pinecone
    if doc.get("pinecone_ids"):
        try:
            await delete_document_from_index(doc["pinecone_ids"])
        except Exception as e:
            print(f"⚠️ Pinecone delete failed: {e}")
            # Continue to delete from DB even if Pinecone fails
            
    # Delete from Internal Documents (Keyword Search)
    from app.db.mongodb import db
    await db.internal_documents.delete_many({"doc_id": doc_id})
    
    # Delete file
    file_pattern = f"{doc_id}_*"
    for file_path in UPLOAD_DIR.glob(file_pattern):
        try:
            file_path.unlink()
        except Exception:
            pass
    
    # Delete from MongoDB
    await DocumentModel.delete(doc_id)
    
    return {"message": f"Document {doc['filename']} deleted successfully"}
