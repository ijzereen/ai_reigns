from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.core import security
from app.core.config import settings
from app.crud import crud_user
from app.schemas import user as user_schema, token as token_schema # Renamed for clarity
from app.models import user as user_model

def signup(db: Session, user_create: user_schema.UserCreate) -> user_model.User:
    db_user_by_email = crud_user.get_user_by_email(db, email=user_create.email)
    if db_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    db_user_by_username = crud_user.get_user_by_username(db, username=user_create.username)
    if db_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    return crud_user.create(db=db, obj_in=user_create)

def login(db: Session, email: str, password: str) -> token_schema.Token:
    user = crud_user.authenticate_user(db, email=email, password=password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # if not user.is_active: # Add if needed
    #     raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    user_out = user_schema.User.from_orm(user)
    return token_schema.Token(access_token=access_token, token_type="bearer", user=user_out)