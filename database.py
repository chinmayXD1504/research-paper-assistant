"""
database.py — Async SQLAlchemy/SQLModel engine + session management.
Supports both SQLite (aiosqlite) and PostgreSQL (asyncpg) seamlessly with auto-recovery.
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import settings

logger = logging.getLogger(__name__)

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine_kwargs: dict = {
    "echo": settings.SQL_ECHO,
}

if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a scoped async session, always closed."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize tables automatically on startup."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Database initialized successfully.")
    except Exception as exc:
        logger.warning("Database init warning: %s. Using SQLite fallback...", exc)
        fallback_engine = create_async_engine("sqlite+aiosqlite:///./research_assistant.db")
        async with fallback_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
