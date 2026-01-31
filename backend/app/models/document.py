"""
Document Model
MongoDB schema for tracking uploaded documents.
"""
from datetime import datetime
from typing import List, Optional
from app.db.mongodb import db


class DocumentModel:
    """Handles document metadata in MongoDB."""
    
    collection = db.documents
    
    @staticmethod
    async def create(
        doc_id: str,
        filename: str,
        doc_type: str,
        uploaded_by: str = "system"
    ):
        """Create a new document record."""
        document = {
            "_id": doc_id,
            "filename": filename,
            "doc_type": doc_type,
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.utcnow(),
            "status": "pending",
            "chunk_count": 0,
            "pinecone_ids": []
        }
        
        await DocumentModel.collection.insert_one(document)
        return document
    
    @staticmethod
    async def update_status(
        doc_id: str,
        status: str,
        chunk_count: int = 0,
        pinecone_ids: List[str] = None
    ):
        """Update document processing status."""
        update_data = {
            "status": status,
            "chunk_count": chunk_count
        }
        
        if pinecone_ids:
           update_data["pinecone_ids"] = pinecone_ids
        
        await DocumentModel.collection.update_one(
            {"_id": doc_id},
            {"$set": update_data}
        )
    
    @staticmethod
    async def get_all():
        """Get all documents."""
        cursor = DocumentModel.collection.find({})
        documents = await cursor.to_list(length=1000)
        return documents
    
    @staticmethod
    async def get_by_id(doc_id: str):
        """Get document by ID."""
        return await DocumentModel.collection.find_one({"_id": doc_id})
    
    @staticmethod
    async def delete(doc_id: str):
        """Delete document record."""
        doc = await DocumentModel.get_by_id(doc_id)
        if doc:
            await DocumentModel.collection.delete_one({"_id": doc_id})
        return doc
