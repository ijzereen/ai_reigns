from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URL,
    # connect_args={"check_same_thread": False} # Needed only for SQLite
)
if "sqlite" in settings.SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 