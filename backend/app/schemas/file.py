from pydantic import BaseModel
from typing import Optional

class FileResponse(BaseModel):
    file_id: str
    file_path: str # URL or path to the file
    file_name: str
    content_type: str
    size_bytes: int

    class Config:
        from_attributes = True 