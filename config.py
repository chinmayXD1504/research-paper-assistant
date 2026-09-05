from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Defaults to zero-configuration SQLite for local development.
    # Can be set to "postgresql+asyncpg://postgres:postgres@localhost:5432/research_assistant" in .env
    DATABASE_URL: str = "sqlite+aiosqlite:///./research_assistant.db"
    SQL_ECHO: bool = False

    SECRET_KEY: str = "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    GEMINI_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "research-assistant"
    PINECONE_REGION: str = "us-east-1"

    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: list[str] = ["*"]


settings = Settings()
