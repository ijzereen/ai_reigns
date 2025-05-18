from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.apis import deps
from app.schemas import user as user_schema, token as token_schema # Renamed for clarity
from app.services import auth_service
from app.models import user as user_model

router = APIRouter()

@router.post("/signup", response_model=user_schema.User)
def signup(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    user_in: user_schema.UserCreate
):
    return auth_service.signup(db=db, user_create=user_in)

@router.post("/login", response_model=token_schema.Token)
def login(
    db: Annotated[Session, Depends(deps.get_db)], 
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    return auth_service.login(db=db, email=form_data.username, password=form_data.password)

@router.post("/logout") # Placeholder, actual implementation might involve token blocklisting
def logout(current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]):
    return {"message": "Successfully logged out"} 