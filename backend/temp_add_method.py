"""
Temporary script to add delete_company method to admin_helpers.py
"""

delete_method = '''    
    @staticmethod
    async def delete_company(company_id: str) -> bool:
        """
        Completely delete a company and all associated data.
        
        This includes:
        - MongoDB company record
        - All document chunks
        - Pinecone namespace with all vectors
        
        Returns True if company was deleted, False if not found.
        """
        from app.db.pinecone_client import get_index
        
        company_id_lower = company_id.lower()
        
        # 1. Delete company record from MongoDB
        result = await db.admins.delete_one({"company_id": company_id_lower})
        
        if result.deleted_count == 0:
            return False
        
        # 2. Delete all chunks associated with this company
        await db.chunks.delete_many({"company_id": company_id_lower})
        
        # 3. Delete Pinecone namespace (all vectors for this company)
        try:
            index = get_index()
            index.delete(delete_all=True, namespace=company_id_lower)
            print(f"🗑️ DELETED: Pinecone namespace '{company_id_lower}' wiped")
        except Exception as e:
            print(f"⚠️ WARNING: Failed to delete Pinecone namespace '{company_id_lower}': {e}")
        
        print(f"✅ COMPANY DELETED: '{company_id}' and all associated data removed")
        return True
'''

with open('C:\\Users\\Lenovo\\CORPWISE\\backend\\app\\models\\admin_helpers.py', 'a') as f:
    f.write(delete_method)

print("✅ Added delete_company method")
