"""
Admin API Routes
Endpoints for document management.
"""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel

from app.models.document import DocumentModel
from app.services.document_processor import process_and_index_document, delete_document_from_index
from app.core.usage_middleware import check_usage_limits

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
    request: Request, # Added request to get headers
    file: UploadFile = File(...),
    doc_type: str = "general"
):
    """
    Upload and process a document.
    
    Supported formats: .md, .txt
    """
    # Extract Company ID
    company_id = request.headers.get("X-Company-ID", None)
    
    # Check document upload limit
    if company_id:
        await check_usage_limits(request, company_id, action="document")

    # Validate file type
    if not file.filename.lower().endswith(('.md', '.txt', '.pdf')):
        raise HTTPException(
            status_code=400,
            detail="Only .md, .txt, and .pdf files are supported"
        )
    
        #Generate unique document ID
    doc_id = str(uuid.uuid4())
    
    # Save file
    file_path = UPLOAD_DIR / f"{doc_id}_{file.filename}"
    
    try:
        # Write uploaded file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Get company tier to determine dimensions
        from app.db.mongodb import db
        from app.models.subscription import get_tier_dimensions
        
        company = None
        dimensions = 384  # Default to starter
        
        if company_id:
            company = await db.admins.find_one({"company_id": company_id.lower()})
            if company:
                tier = company.get("subscription_tier", "starter")
                dimensions = get_tier_dimensions(tier)
                print(f"🏢 Company '{company_id}' tier: {tier} → using {dimensions}-dim embeddings")
        
        # Create document record
        await DocumentModel.create(
            doc_id=doc_id,
            filename=file.filename,
            doc_type=doc_type,
            company_id=company_id # Save namespace
        )
        
        # Process and index with tier-specific dimensions
        result = await process_and_index_document(
            file_path=str(file_path),
            doc_id=doc_id,
            doc_type=doc_type,
            filename=file.filename,
            company_id=company_id, # Pass namespace
            dimensions=dimensions    # Pass tier-specific dimensions
        )
        
        # Update document status
        await DocumentModel.update_status(
            doc_id=doc_id,
            status=result["status"],
            chunk_count=result["chunk_count"],
            pinecone_ids=result["pinecone_ids"]
        )
        
        # Increment document count for the company
        if company_id:
            from app.models.admin_helpers import AdminSubscriptionHelpers
            await AdminSubscriptionHelpers.increment_document_count(company_id)
        
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
async def list_documents(request: Request):
    """Get all uploaded documents, strictly filtered by Company ID."""
    company_id = request.headers.get("X-Company-ID", None)
    
    if not company_id:
        # STRICT ISOLATION: Do not return any documents if company ID is undefined
        return {"documents": []}
        
    documents = await DocumentModel.get_all(company_id=company_id)
    return {"documents": documents}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, request: Request):
    """Delete a document and remove from Pinecone."""
    company_id = request.headers.get("X-Company-ID", None)

    # Get document
    doc = await DocumentModel.get_by_id(doc_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from Pinecone
    if doc.get("pinecone_ids"):
        try:
            await delete_document_from_index(doc["pinecone_ids"], company_id=company_id)
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


# ============================
# Subscription Management
# ============================
class UpdateSubscriptionRequest(BaseModel):
    tier_id: str

@router.put("/subscription")
async def update_my_subscription(
    payload: UpdateSubscriptionRequest,
    request: Request
):
    """
    Update the calling admin's subscription tier.
    """
    company_id = request.headers.get("X-Company-ID")
    if not company_id:
        raise HTTPException(status_code=400, detail="Missing Company ID header")
        
    from app.models.admin import AdminModel
    from app.models.subscription import SUBSCRIPTION_TIERS
    
    if payload.tier_id not in SUBSCRIPTION_TIERS:
         raise HTTPException(status_code=400, detail="Invalid subscription tier")
         
    # Update in DB
    result = await AdminModel.collection.update_one(
        {"company_id": company_id},
        {"$set": {"subscription_tier": payload.tier_id}}
    )
    
    if result.modified_count == 0:
        # Check if it was already that tier
        admin = await AdminModel.get_by_company(company_id)
        if admin and admin.get("subscription_tier") == payload.tier_id:
            return {"message": "Subscription already up to date", "tier": payload.tier_id}
        raise HTTPException(status_code=500, detail="Failed to update subscription")
        
    return {"message": "Subscription updated successfully", "tier": payload.tier_id}
