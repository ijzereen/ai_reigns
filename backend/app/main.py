from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # For serving uploaded files
from pathlib import Path # For path operations
from fastapi.middleware.cors import CORSMiddleware # Import CORS middleware

from app.core.config import settings
from app.db.session import engine #, SessionLocal # Not creating tables directly here
from app.db.base import Base # To create tables
from app.apis.routes import auth, stories, files, game # Added game router

# Create database tables (For development only. Use Alembic for production migrations)
# def create_db_and_tables():
# Base.metadata.create_all(bind=engine)
# create_db_and_tables() # Call on startup for dev

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json", 
    # docs_url="/docs", # 기본값 사용
    # redoc_url="/redoc", # 기본값 사용
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect", 
    swagger_ui_init_oauth={
        "clientId": "dummyClientId", # Not used by password flow, but required by Swagger UI
        "clientSecret": "dummyClientSecret", # Not used by password flow
        "appName": settings.PROJECT_NAME,
        "usePkceWithAuthorizationCodeGrant": False, # Using password flow
        # "scopes": "openid profile email", # Optional: define scopes if your app uses them
        "tokenUrl": "/api/auth/login" # Explicitly set the correct token URL
    }
)

# --- CORS Middleware --- 
# Allow all origins for local development. 
# For production, specify allowed origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.PROJECT_NAME == "AI Reigns Backend" else [], # Looser for dev
    # allow_origins=["http://localhost:3000", "http://localhost:3001"], # Example for specific origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# --- Mount static files directory for uploads ---
# This makes files in backend/uploads accessible via /static/uploads URL path
# Ensure UPLOAD_DIR from file_service.py is relative to where the app runs or adjust path here
# For example, if UPLOAD_DIR is "uploads/images", and it's in the backend root:
UPLOAD_DIR_MAIN = Path(__file__).resolve().parent.parent / "uploads" # This points to backend/uploads
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR_MAIN), name="static_uploads")
# The file_service.py should return paths like "/static/uploads/images/filename.ext"


@app.on_event("startup")
def on_startup():
    # This is a good place to create DB tables if you are not using migrations like Alembic
    # For simplicity in this auto-generated setup, we'll call it here.
    # In a real app, you'd likely use Alembic.
    Base.metadata.create_all(bind=engine)
    print("Database tables created on startup (if they didn't exist).")

# --- Routers ---
# Note: If you use API_V1_STR as a prefix in router includes,
# the tokenUrl in deps.py (OAuth2PasswordBearer) should also reflect this.
# For now, keeping it simple without the /api/v1 prefix in routers themselves,
# but the openapi_url is set up for it if you decide to version like that.

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(stories.router, prefix="/api", tags=["Stories & Gameplay"])
app.include_router(files.router, prefix="/api/files", tags=["File Uploads"])
app.include_router(game.router, prefix="/api/stories", tags=["Game Progress"]) # Game router for progress

@app.get("/")
async def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"} 