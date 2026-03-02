"""
User Model
MongoDB schema for user authentication.
"""
import hashlib
import os
from datetime import datetime
from typing import Optional
from app.db.mongodb import db


class UserModel:
    """Handles user authentication and profile data."""
    
    collection = db.users
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Simple SHA-256 hash with salt (for basic security without extra deps)."""
        # In production, use bcrypt/passlib
        salt = os.getenv("SECRET_KEY", "corpwise_salt")
        return hashlib.sha256((password + salt).encode()).hexdigest()

    @staticmethod
    async def create(username: str, password: str, company_id: str, google_id: str = None):
        """Create a new user."""
        existing = await UserModel.get_by_username(username)
        if existing:
            return None
            
        is_admin = False
        # Hardcode first admin for simplicity or check specific pattern
        if username.lower() == "admin":
            is_admin = True

        hashed_password = None
        if password:
            hashed_password = UserModel.hash_password(password)

        user = {
            "google_id": google_id,
            "username": username,
            "password_hash": hashed_password,
            "company_id": company_id,
            "is_admin": is_admin,
            "created_at": datetime.utcnow()
        }
        
        await UserModel.collection.insert_one(user)
        return user
    
    @staticmethod
    async def get_by_username(username: str):
        """Get user by username."""
        return await UserModel.collection.find_one({"username": username})

    @staticmethod
    async def get_by_google_id(google_id: str):
        """Get user by google_id."""
        return await UserModel.collection.find_one({"google_id": google_id})
    
    @staticmethod
    async def verify_user(username: str, password: str):
        """Verify username and password."""
        user = await UserModel.get_by_username(username)
        if not user:
            return None
            
        hashed = UserModel.hash_password(password)
        if user["password_hash"] == hashed:
            return user
        return None
