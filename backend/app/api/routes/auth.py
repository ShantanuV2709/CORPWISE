"""
Auth API Routes
Endpoints for user authentication.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.models.user import UserModel

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================
# Request Schemas
# ============================
class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    company_id: str = Field(..., min_length=2)


class LoginRequest(BaseModel):
    username: str
    password: str


# ============================
# Auth Endpoints
# ============================
@router.post("/signup")
async def signup(payload: SignupRequest):
    """Register a new user."""
    # Check if user exists
    existing = await UserModel.get_by_username(payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create user
    user = await UserModel.create(
        username=payload.username,
        password=payload.password,
        company_id=payload.company_id
    )
    
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")

    return {
        "message": "User created successfully",
        "username": user["username"],
        "company_id": user["company_id"]
    }


@router.post("/login")
async def login(payload: LoginRequest):
    """Authenticate user (EMPLOYEE)."""
    user = await UserModel.verify_user(payload.username, payload.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "message": "Login successful",
        "username": user["username"],
        "company_id": user["company_id"],
        "is_admin": False # Employees are never admins of the system
    }


# ============================
# Admin / Organization Auth
# ============================
from app.models.admin import AdminModel

class AdminSignupRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    company_id: str = Field(..., min_length=2)
    subscription_tier: str = Field(default="professional")  # NEW: default to professional

class AdminLoginRequest(BaseModel):
    username: str
    password: str
    company_id: str

@router.post("/admin/signup")
async def admin_signup(payload: AdminSignupRequest):
    """Register a new ORGANIZATION (Admin Account)."""
    # Check if company already exists (unique constraint on company_id usually desired)
    existing_org = await AdminModel.get_by_company(payload.company_id)
    if existing_org:
         raise HTTPException(status_code=400, detail="Organization ID already exists")

    # Check if username exists in admins
    existing_user = await AdminModel.get_by_username(payload.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Admin username already exists")

    # Debug Payload
    print(f"DEBUG ADMIN SIGNUP: user={payload.username}, pwd_len={len(payload.password)}, company={payload.company_id}, tier={payload.subscription_tier}")
    if len(payload.password) > 70:
        print(f"DEBUG: Password excessively long: {payload.password[:20]}...")

    # Validate subscription tier
    from app.models.subscription import SUBSCRIPTION_TIERS
    if payload.subscription_tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid subscription tier. Choose from: {list(SUBSCRIPTION_TIERS.keys())}")

    # Create admin
    try:
        admin = await AdminModel.create(
            username=payload.username,
            password=payload.password,
            company_id=payload.company_id,
            subscription_tier=payload.subscription_tier
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "Organization registered successfully",
        "username": admin["username"],
        "company_id": admin["company_id"],
        "subscription_tier": admin["subscription_tier"]
    }

@router.post("/admin/login")
async def admin_login(payload: AdminLoginRequest):
    """Authenticate Organization Admin."""
    
    # 🦸 SUPER ADMIN BACKDOOR
    # 🦸 SUPER ADMIN BACKDOOR
    # 🦸 SUPER ADMIN BACKDOOR
    from app.core.config import SUPER_USER_KEY
    print(f"DEBUG: SuperUser Login Attempt. User={payload.username}, ConfigKeyPresent={bool(SUPER_USER_KEY)}")
    
    if SUPER_USER_KEY and payload.password.strip() == SUPER_USER_KEY:
        return {
            "message": "Super Admin Login",
            "username": "superuser",
            "company_id": "GLOBAL",
            "is_super_admin": True
        }

    admin = await AdminModel.verify_credentials(payload.username, payload.password, payload.company_id)
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials or company ID")

    return {
        "message": "Admin Login successful",
        "username": admin["username"],
        "company_id": admin["company_id"],
        "subscription_tier": admin.get("subscription_tier", "professional"),
        "is_super_admin": admin.get("is_super_admin", False)
    }
