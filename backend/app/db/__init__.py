# backend/app/db/__init__.py
from .base import Base # Make Base accessible via app.db.Base
from .session import engine, SessionLocal # Make engine and SessionLocal accessible 