# Story Game Backend

This is the backend for the interactive story game project, built with FastAPI and a layered architecture.

## Setup

1. Clone the repository.
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`
4. Create a `.env` file based on the `.env.example` (if provided) and fill in the necessary environment variables.

## Running the application

```bash
uvicorn app.main:app --reload
