from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean # Boolean으로 is_active 변경
from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func # TimestampedModel에서 사용
from .base import Base, TimestampedModel # 변경된 파일명 및 TimestampedModel 임포트

class User(TimestampedModel):
    """
    사용자 모델
    """
    __tablename__ = "users"

    # id, created_at, updated_at는 TimestampedModel에서 상속
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True) # 닉네임 또는 표시 이름
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True) # DateTime 대신 Boolean 사용 (구조도 참고)

    stories = relationship("Story", back_populates="creator", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"
