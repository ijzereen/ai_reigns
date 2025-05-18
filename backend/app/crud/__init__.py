# backend/app/crud/__init__.py
# This will make it easier to import crud instances and their methods
from .crud_user import crud_user
from .crud_story import crud_story
# Add crud_file if you implement it (e.g., from .crud_file import crud_file) 