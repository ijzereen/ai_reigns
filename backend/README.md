# Backend for AI Reigns

This directory contains the FastAPI backend for the AI Reigns application.

## Project Structure

```
ai_reigns_backend/
├── app/                  # Main application module
│   ├── __init__.py
│   ├── main.py           # FastAPI app instantiation, global config, startup events
│   ├── core/             # Core logic: settings, security
│   ├── apis/             # API endpoint definitions (routers & dependencies)
│   ├── schemas/          # Pydantic models for data validation & serialization
│   ├── services/         # Business logic layer
│   ├── crud/             # Database CRUD operations
│   ├── models/           # SQLAlchemy ORM models
│   └── db/               # Database session management and base model
├── tests/                # Test suite (to be implemented)
├── uploads/              # Directory for user-uploaded files (e.g., images)
│   └── images/
├── .env                  # Environment variables (DB connection, secrets)
├── .gitignore            # Standard Python .gitignore
├── Dockerfile            # (Optional) For containerization
├── requirements.txt      # Python package dependencies
└── README.md             # This file
```

## Setup and Running

1.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    You might need to install `python-multipart` if it's not included by uvicorn standard or fastapi:
    ```bash
    pip install python-multipart
    ```

3.  **Configure Environment Variables:**
    Copy `.env.example` to `.env` (if an example is provided) or create `.env` based on the structure in `app/core/config.py` and the sample `.env` file. At a minimum, ensure `SQLALCHEMY_DATABASE_URL` and `SECRET_KEY` are set.
    For SQLite (default), no external database server is needed.

4.  **Run the development server:**
    The application uses Uvicorn to run.
    Navigate to the `backend` directory (where `app` and `main.py` inside `app` are located).
    ```bash
    uvicorn app.main:app --reload
    ```
    This will start the server, typically on `http://127.0.0.1:8000`.
    The `--reload` flag enables auto-reloading when code changes are detected.

5.  **Access API Docs:**
    Once the server is running, you can access the interactive API documentation (Swagger UI) at:
    `http://127.0.0.1:8000/docs`
    And ReDoc at:
    `http://127.0.0.1:8000/redoc`

## Database Migrations (Recommended for Production)

For production environments, or when your database schema evolves, it's highly recommended to use a database migration tool like Alembic. 
-   Initialize Alembic: `alembic init alembic`
-   Configure `alembic.ini` and `env.py`.
-   Generate migration scripts: `alembic revision -m "create_initial_tables"`
-   Apply migrations: `alembic upgrade head`

(The current setup creates tables directly on startup via `Base.metadata.create_all(engine)` in `main.py` for development simplicity.)

## Next Steps / TODOs

-   Implement detailed business logic in `services/`.
-   Implement actual LLM calls in `services/game_service.py` and `services/story_service.py` (for AI generation).
-   Add comprehensive tests in the `tests/` directory.
-   Set up database migrations with Alembic for robust schema management.
-   Refine error handling and logging.
-   Secure sensitive configurations (e.g., load `SECRET_KEY` from environment only).
-   Consider implementing token blocklisting for logout if needed.
-   Develop frontend (`ai_reigns/frontend`) to integrate with these APIs. 