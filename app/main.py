from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.database import engine, Base
from app.routers import auth, users, bookings, rooms, guest, admin, ai, staff, notifications, access, analytics
from app.core.logging import logger
import time

# Create tables
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Hospitality Platform")

origins = [
    "https://lux-henna-two.vercel.app",
    "http://localhost:3000",
    "http://localhost:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/api_status")
def api_status():
    return {"status": "active", "version": "new_code_loaded"}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Time: {process_time:.4f}s")
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/user", tags=["Users"])
app.include_router(bookings.router, prefix="/booking", tags=["Bookings"])
app.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
app.include_router(guest.router, prefix="/guest", tags=["Guest"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(staff.router, prefix="/staff", tags=["Staff"])
app.include_router(ai.router, prefix="/ai", tags=["AI Engine"])
app.include_router(notifications.router, prefix="/notify", tags=["Notifications"])
app.include_router(access.router, prefix="/access", tags=["Access Credentials"])
app.include_router(access.router, prefix="/access", tags=["Access Credentials"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

# Dynamic import to avoid circular dependency issues if any
from app.routers import chat
app.include_router(chat.router, prefix="/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "Welcome to the AI Hospitality Platform API"}
