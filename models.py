"""
models.py — SQLModel table definitions: users, papers, chunks, citations, chat_history.
Compatible with PostgreSQL, SQLite, Pylance, and VS Code typing.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from sqlalchemy import Column, String, JSON
from sqlmodel import Field, Relationship, SQLModel


class PaperStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"
    UNSUPPORTED = "unsupported"


class ChatRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(sa_column=Column(String(255), unique=True, nullable=False, index=True))
    password_hash: str = Field(max_length=255, nullable=False)
    full_name: Optional[str] = Field(default=None, max_length=150)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    papers: List["Paper"] = Relationship(back_populates="owner")


class Paper(SQLModel, table=True):
    __tablename__ = "papers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False, index=True)
    title: Optional[str] = Field(default=None)
    authors: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    filename: str = Field(max_length=255, nullable=False)
    storage_path: str = Field(nullable=False)
    status: PaperStatus = Field(default=PaperStatus.QUEUED, index=True)
    failure_reason: Optional[str] = Field(default=None)
    page_count: Optional[int] = Field(default=None)
    summary: Optional[str] = Field(default=None)
    key_findings: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    methodology: Optional[str] = Field(default=None)
    limitations: Optional[str] = Field(default=None)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    owner: Optional[User] = Relationship(back_populates="papers")
    chunks: List["Chunk"] = Relationship(back_populates="paper")
    citations: List["Citation"] = Relationship(back_populates="paper")


class Chunk(SQLModel, table=True):
    __tablename__ = "chunks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    paper_id: uuid.UUID = Field(foreign_key="papers.id", nullable=False, index=True)
    chunk_index: int = Field(nullable=False)
    page_number: Optional[int] = Field(default=None)
    content: str = Field(nullable=False)
    pinecone_vector_id: Optional[str] = Field(default=None, max_length=100, unique=True)
    token_count: Optional[int] = Field(default=None)

    paper: Optional[Paper] = Relationship(back_populates="chunks")


class Citation(SQLModel, table=True):
    __tablename__ = "citations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    paper_id: uuid.UUID = Field(foreign_key="papers.id", nullable=False, index=True)
    raw_text: str = Field(nullable=False)
    parsed_authors: Optional[str] = Field(default=None)
    parsed_year: Optional[int] = Field(default=None)
    parsed_title: Optional[str] = Field(default=None)

    paper: Optional[Paper] = Relationship(back_populates="citations")


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_history"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    paper_id: uuid.UUID = Field(foreign_key="papers.id", nullable=False, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    role: ChatRole = Field(nullable=False)
    content: str = Field(nullable=False)
    citation_refs: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)
