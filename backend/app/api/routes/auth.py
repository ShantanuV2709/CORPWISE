"""
Auth API Routes
Endpoints for user authentication.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from google.oauth2 import id_token
from google.auth.transport import requests

# Add your Google Client ID here
GOOGLE_CLIENT_ID = "1043273918260-0svv25kupkm0tnm7vdm4pd47tfh0io2q.apps.googleusercontent.com"

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

    from app.core.security import create_access_token
    access_token = create_access_token({
        "sub": user["username"], 
        "company_id": user["company_id"], 
        "role": "employee"
    })

    return {
        "message": "Login successful",
        "username": user["username"],
        "company_id": user["company_id"],
        "is_admin": False, # Employees are never admins of the system
        "access_token": access_token
    }

class GoogleLoginRequest(BaseModel):
    token: str
    company_id: str = None  # Needed for signup, optional for login if we uniquely identify by google_id
    role: str = "employee"  # 'employee' or 'admin'

@router.post("/google")
async def google_login(payload: GoogleLoginRequest):
    """Authenticate or Register a user/admin via Google."""
    try:
        # Verify Google Token
        idinfo = id_token.verify_oauth2_token(
            payload.token, requests.Request(), GOOGLE_CLIENT_ID
        )
        
        google_id = idinfo['sub']
        email = idinfo['email']
        username = email.split('@')[0] # Default username from email

        # Routing logic based on requested Role
        if payload.role == "admin":
            # Admin Flow
            from app.models.admin import AdminModel
            from app.core.security import create_access_token
            
            admin = await AdminModel.get_by_google_id(google_id)
            is_new_user = False
            if not admin:
                # Need company_id to create
                if not payload.company_id:
                     raise HTTPException(status_code=400, detail="Company ID required to register new Admin")
                
                admin = await AdminModel.create(
                    username=username,
                    password=None, # No password for Google auth
                    company_id=payload.company_id,
                    google_id=google_id
                )
                is_new_user = True
            
            access_token = create_access_token({
                "sub": admin["username"], 
                "company_id": admin["company_id"], 
                "role": "super_admin" if admin.get("is_super_admin") else "admin"
            })
            
            return {
                "message": "Admin Google Login successful",
                "username": admin["username"],
                "company_id": admin["company_id"],
                "is_admin": True,
                "is_new_user": is_new_user,
                "access_token": access_token
            }
        
        else:
            # Employee Flow
            user = await UserModel.get_by_google_id(google_id)
            is_new_user = False
            if not user:
                # Auto-register employee
                if not payload.company_id:
                     raise HTTPException(status_code=400, detail="Company ID required to register new Employee")
                
                user = await UserModel.create(
                    username=username,
                    password=None,
                    company_id=payload.company_id,
                    google_id=google_id
                )
                is_new_user = True
            
            from app.core.security import create_access_token
            access_token = create_access_token({
                "sub": user["username"], 
                "company_id": user["company_id"], 
                "role": "employee"
            })
            
            return {
                "message": "User Google Login successful",
                "username": user["username"],
                "company_id": user["company_id"],
                "is_admin": False,
                "is_new_user": is_new_user,
                "access_token": access_token
            }

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")


# ============================
# Admin / Organization Auth
# ============================
from app.models.admin import AdminModel
from app.core.security import create_access_token

class AdminSignupRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    company_id: str = Field(..., min_length=2)
    email: str = Field(..., description="A valid Gmail address for billing and notifications")
    subscription_tier: str = Field(default="starter")  # Default to starter; users choose in billing tab

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
    print(f"DEBUG ADMIN SIGNUP: user={payload.username}, pwd_len={len(payload.password)}, company={payload.company_id}, email={payload.email}, tier={payload.subscription_tier}")
    if len(payload.password) > 70:
        print(f"DEBUG: Password excessively long: {payload.password[:20]}...")

    # Validate Email is a Gmail
    if not payload.email.lower().endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="A valid Gmail address (@gmail.com) is required for registration.")

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
            email=payload.email,
            subscription_tier=payload.subscription_tier
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    access_token = create_access_token({
        "sub": admin["username"], 
        "company_id": admin["company_id"], 
        "role": "admin"
    })

    return {
        "message": "Organization registered successfully",
        "username": admin["username"],
        "company_id": admin["company_id"],
        "subscription_tier": admin["subscription_tier"],
        "access_token": access_token
    }

@router.post("/admin/login")
async def admin_login(payload: AdminLoginRequest):
    """Authenticate Organization Admin."""
    
    # 🦸 SUPER ADMIN BACKDOOR
    # 🦸 SUPER ADMIN BACKDOOR
    # 🦸 SUPER ADMIN BACKDOOR
    from app.core.config import SUPER_USER_KEY
    print(f"DEBUG: SuperUser Login Attempt. User={payload.username}, ConfigKeyPresent={bool(SUPER_USER_KEY)}")
    
    if SUPER_USER_KEY and payload.password.strip() == SUPER_USER_KEY and payload.username.strip() == "superadmin":
        access_token = create_access_token({
            "sub": "superuser", 
            "company_id": "GLOBAL", 
            "role": "super_admin"
        })
        return {
            "message": "Super Admin Login",
            "username": "superuser",
            "company_id": "GLOBAL",
            "is_super_admin": True,
            "access_token": access_token
        }

    admin = await AdminModel.verify_credentials(payload.username, payload.password, payload.company_id)
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials or company ID")

    access_token = create_access_token({
        "sub": admin["username"], 
        "company_id": admin["company_id"], 
        "role": "super_admin" if admin.get("is_super_admin") else "admin"
    })

    return {
        "message": "Admin Login successful",
        "username": admin["username"],
        "company_id": admin["company_id"],
        "subscription_tier": admin.get("subscription_tier", "starter"),
        "is_super_admin": admin.get("is_super_admin", False),
        "access_token": access_token
    }
