from typing import Generator, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import user as user_model # Renamed to avoid conflict
from app.schemas import token as token_schema # Renamed for clarity
from app.crud import crud_user

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login" 
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Annotated[Session, Depends(get_db)], token: Annotated[str, Depends(reusable_oauth2)]
) -> user_model.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = token_schema.TokenPayload(email=email) # Corrected field name if needed
    except JWTError:
        raise credentials_exception
    
    db_user = crud_user.get_user_by_email(db, email=token_data.email)
    if db_user is None:
        raise credentials_exception
    return db_user

async def get_current_active_user(
    current_user: Annotated[user_model.User, Depends(get_current_user)]
) -> user_model.User:
    # if not current_user.is_active: # Add is_active field to User model if needed
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user 