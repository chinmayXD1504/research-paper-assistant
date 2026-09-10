"""
database.py — Async SQLAlchemy/SQLModel engine + session management.
"""
from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import config 
engine = create_async_engine(
    config.settings.DATABASE_URL,
    echo=config.settings.SQL_ECHO,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
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
    """Dev-only convenience — prefer Alembic migrations in any real environment."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
