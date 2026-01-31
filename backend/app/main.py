from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import logging

from app.api.routes.chat import router as chat_router
from app.api.routes.system import router as system_router
from app.api.routes.users import router as users_router
from app.api.routes.conversations import router as conversations_router

from app.core.rate_limit import limiter
from app.db.mongodb import db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

# =====================================================
# Lifespan (Startup / Shutdown)
# =====================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    collections = await db.list_collection_names()
    print("✅ MongoDB connected. Collections:", collections)
    yield
    print("🛑 CORPWISE shutting down")

# =====================================================
# FastAPI App (CREATE FIRST)
# =====================================================
app = FastAPI(
    title="CORPWISE AI Platform",
    lifespan=lifespan
)

# =====================================================
# CORS Middleware (MUST COME AFTER app creation)
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React (CRA)
        "http://localhost:5173",  # Vite
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Routers
# =====================================================
from app.api.routes.feedback import router as feedback_router
from app.api.routes.admin import router as admin_router

app.include_router(system_router)
app.include_router(users_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(feedback_router)
app.include_router(admin_router)

# =====================================================
# Rate Limiter
# =====================================================
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"message": "Too many requests. Please slow down."}
    )

# =====================================================
# Health & Diagnostics
# =====================================================
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/db-check")
async def db_check():
    collections = await db.list_collection_names()
    return {
        "mongo_connected": True,
        "collections": collections
    }
