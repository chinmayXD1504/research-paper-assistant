from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Defaults to zero-configuration SQLite for local development.
    # Can be set to "postgresql+asyncpg://postgres:postgres@localhost:5432/research_assistant" in .env
    DATABASE_URL: str = "sqlite+aiosqlite:///./research_assistant.db"
    SQL_ECHO: bool = False

    SECRET_KEY: str = "change-me-in-prod-secret-key-123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    GEMINI_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "research-assistant"
    PINECONE_REGION: str = "us-east-1"

    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


settings = Settings()
