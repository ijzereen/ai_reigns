from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.apis import deps
from app.services import file_service
from app.models import user as user_model # For current_user dependency
from app.schemas import file as file_schema # For response model

router = APIRouter()

@router.post("/upload/image", response_model=file_schema.FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    db: Annotated[Session, Depends(deps.get_db)], 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)],
    image: UploadFile = File(...)
):
    # Basic validation for image type, size can be added here or in service
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type")
    
    return await file_service.save_uploaded_image(db=db, user_id=current_user.id, uploaded_file=image) 