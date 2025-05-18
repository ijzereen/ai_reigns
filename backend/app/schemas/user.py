from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Any, Dict, List, Optional

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    username: str

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

# Properties stored in DB
class UserInDBBase(UserBase):
    id: int
    hashed_password: str
    # is_active: bool = True # If you add activation logic

    class Config:
        from_attributes = True # Replaces orm_mode = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    pass 