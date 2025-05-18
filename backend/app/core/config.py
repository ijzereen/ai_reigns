from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Reigns Backend"
    API_V1_STR: str = "/api/v1"

    # Database
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./sql_app.db" # Default to SQLite for simplicity
    # Example for PostgreSQL:
    # SQLALCHEMY_DATABASE_URL: str = "postgresql://user:password@host:port/dbname"

    # JWT
    SECRET_KEY: str = "a_very_secret_key_that_should_be_in_env_file"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # LLM (Placeholder)
    OPENAI_API_KEY: str | None = None # Example for OpenAI

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings() 