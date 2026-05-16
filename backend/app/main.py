from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings

from app.routers import auth, users, roadmap, chat, documents, quiz, progress, admin, notes, notifications

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AI Study Planner API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
import logging
import os
import time

if not os.path.exists("logs"):
    os.makedirs("logs")

# Configure custom logger
app_logger = logging.getLogger("lumina")
app_logger.setLevel(logging.INFO)
file_handler = logging.FileHandler("logs/server.log")
file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(client)s: %(method)s %(url)s - %(status)s - %(duration)sms"))
app_logger.addHandler(file_handler)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = int((time.time() - start_time) * 1000)
        app_logger.info("", extra={
            "client": request.client.host if request.client else "unknown",
            "method": request.method,
            "url": request.url.path,
            "status": response.status_code,
            "duration": duration
        })
        return response
    except Exception as e:
        duration = int((time.time() - start_time) * 1000)
        app_logger.error(f"Exception: {str(e)}", extra={
            "client": request.client.host if request.client else "unknown",
            "method": request.method,
            "url": request.url.path,
            "status": 500,
            "duration": duration
        })
        raise
# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.error(f"Unhandled Exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error"}
    )

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "success", "message": "Welcome to AI Study Planner API"}
