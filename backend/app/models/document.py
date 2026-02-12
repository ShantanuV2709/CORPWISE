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
        uploaded_by: str = "system",
        company_id: Optional[str] = None,
        dimensions: int = 0,
        file_size: int = 0
    ):
        """Create a new document record."""
        document = {
            "_id": doc_id,
            "filename": filename,
            "doc_type": doc_type,
            "uploaded_by": uploaded_by,
            "company_id": company_id,
            "dimensions": dimensions,
            "file_size": file_size,
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
    async def get_all(company_id: Optional[str] = None):
        """Get all documents, optionally filtered by company."""
        query = {}
        if company_id:
            query["company_id"] = company_id
            
        cursor = DocumentModel.collection.find(query)
        documents = await cursor.to_list(length=1000)
        return documents
    
    @staticmethod
    async def get_by_id(doc_id: str, company_id: Optional[str] = None):
        """Get document by ID and optionally Company ID."""
        query = {"_id": doc_id}
        if company_id:
            query["company_id"] = company_id
            
        return await DocumentModel.collection.find_one(query)
    
    @staticmethod
    async def delete(doc_id: str, company_id: Optional[str] = None):
        """Delete document record, ensuring company ownership."""
        query = {"_id": doc_id}
        if company_id:
            query["company_id"] = company_id
            
        result = await DocumentModel.collection.delete_one(query)
        return result.deleted_count > 0
