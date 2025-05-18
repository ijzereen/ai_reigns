import os
import shutil # For copying files if needed
from pathlib import Path
from typing import Annotated
import uuid

from fastapi import UploadFile, HTTPException, status, Depends
from sqlalchemy.orm import Session # If saving file metadata to DB

from app.core.config import settings
from app.schemas import file as file_schema
# from app.crud import crud_file # If you have a CRUD layer for files
# from app.models import file as file_model # If you have a DB model for files

# This directory is relative to the project root (backend/) when the app runs.
# main.py mounts backend/uploads to /static/uploads
# So files saved in backend/uploads/images will be accessible via /static/uploads/images/
UPLOAD_DIR_RELATIVE_TO_BACKEND_ROOT = Path("uploads")
IMAGE_SUBDIR = Path("images")
ABSOLUTE_IMAGE_UPLOAD_DIR = UPLOAD_DIR_RELATIVE_TO_BACKEND_ROOT / IMAGE_SUBDIR
ABSOLUTE_IMAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def save_uploaded_image(
    db: Session, # Placeholder, if you save metadata to DB
    user_id: int, # Placeholder, if you associate file with user
    uploaded_file: UploadFile
) -> file_schema.FileResponse:
    if not uploaded_file.content_type or not uploaded_file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid file type. Only images are allowed."
        )

    file_id = str(uuid.uuid4())
    file_extension = Path(uploaded_file.filename if uploaded_file.filename else '.png').suffix
    # Ensure suffix starts with a dot, or add one if missing and not empty
    if not file_extension.startswith('.') and file_extension:
        file_extension = '.' + file_extension
    elif not file_extension: # Handle empty suffix (e.g. if filename has no extension)
        file_extension = '.png' # Default to png if no extension found

    saved_filename = f"{file_id}{file_extension}"
    file_path_on_disk = ABSOLUTE_IMAGE_UPLOAD_DIR / saved_filename

    try:
        with open(file_path_on_disk, "wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)
        file_size = file_path_on_disk.stat().st_size
    except Exception as e:
        # Log error e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Could not save image file: {e}"
        )
    finally:
        if uploaded_file.file:
            uploaded_file.file.close()
    
    # This path must match how StaticFiles is mounted in main.py
    # main.py mounts `backend/uploads` (UPLOAD_DIR_RELATIVE_TO_BACKEND_ROOT) to `/static/uploads`
    # Files are in `images` subdirectory, so path is `/static/uploads/images/filename`
    access_path = f"/static/uploads/{IMAGE_SUBDIR.name}/{saved_filename}"

    file_data = file_schema.FileResponse(
        file_id=file_id, # Or a DB record ID if you create one
        file_path=access_path, 
        file_name=uploaded_file.filename if uploaded_file.filename else saved_filename, 
        content_type=uploaded_file.content_type,
        size_bytes=file_size
    )

    # Optional: Save file metadata to database
    # db_file = file_model.UploadedFile(id=file_id, user_id=user_id, file_path=str(file_path_on_disk), ...)
    # crud_file.create_file(db=db, file_create=db_file)

    return file_data 