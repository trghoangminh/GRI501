#!/usr/bin/env python3
"""
Startup script: create all tables and run the server.
Falls back to SQLAlchemy create_all if alembic has no migrations yet.
"""
import subprocess
import sys
import os

# Try alembic first
result = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
print(result.stdout)

print("Running SQLAlchemy create_all to ensure all tables exist...")
from app.database import engine, Base
# Import all models to register them
from app.models import user, roadmap, chat, document, quiz, progress, auth
Base.metadata.create_all(bind=engine)
print("Database tables check complete.")
# Start uvicorn
os.execlp("uvicorn", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000")
