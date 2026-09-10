"""
main.py — FastAPI application: routing, CORS, Auth, and the background ingestion pipeline
that ties pdf_processor -> vector_service -> rag_service -> summarization together.
"""
from __future__ import annotations

import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import AsyncSessionLocal, get_db, init_db
from models import Chunk, Paper, PaperStatus, User
from pdf_processor import UnsupportedPdfError, chunk_document
from rag_service import answer_question
from security import (
    create_access_token, 
    get_current_user, 
    hash_password, 
    verify_password, 
    validate_strong_password
)
from vector_service import ensure_index, upsert_chunks, similarity_search

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25MB
UPLOAD_DIR = settings.UPLOAD_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as exc:
        logger.warning("Database init warning: %s", exc)
    try:
        ensure_index()
    except Exception as exc:
        logger.warning("Vector index init warning: %s", exc)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="Intelligent Research Paper Assistant API",
    description="Backend API for Literature Review, Multi-Modal RAG, and Citation Extraction",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class QueryRequest(BaseModel):
    question: str


# --- Health & Base Endpoints ---
@app.get("/", response_class=HTMLResponse, tags=["Health"])
async def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Intelligent Research Paper Assistant API</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
            body { background: #F4EEE1; color: #1c1917; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
            .card { background: #FAF7F2; border: 1.5px solid #D3C4BE; border-radius: 28px; padding: 48px; max-width: 640px; width: 100%; box-shadow: 0 10px 30px rgba(41,37,36,0.06); text-align: center; }
            .badge { display: inline-flex; align-items: center; gap: 6px; background: #E9CCB1; border: 1px solid #C4BDAC; color: #1c1917; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; }
            .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; }
            h1 { font-size: 26px; font-weight: 800; color: #1c1917; margin-bottom: 12px; letter-spacing: -0.5px; }
            p { font-size: 13px; color: #57534e; line-height: 1.6; margin-bottom: 32px; }
            .btn-group { display: flex; flex-direction: column; gap: 12px; }
            @media (min-width: 500px) { .btn-group { flex-direction: row; } }
            .btn { flex: 1; padding: 14px 22px; border-radius: 16px; font-size: 13px; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; }
            .btn-primary { background: #292524; color: #F4EEE1; }
            .btn-primary:hover { background: #1c1917; transform: translateY(-2px); }
            .btn-secondary { background: #E8E6D9; color: #1c1917; border: 1px solid #D3C4BE; }
            .btn-secondary:hover { background: #E4DAC2; transform: translateY(-2px); }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #D3C4BE; font-size: 11px; color: #78716c; font-weight: 600; display: flex; justify-content: space-between; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge"><span class="badge-dot"></span> Backend API Running • Port 8000</div>
            <h1>Intelligent Research Paper Assistant</h1>
            <p>The FastAPI backend server is active and connected. You can launch the interactive frontend dashboard or explore the Swagger API endpoints below.</p>
            
            <div class="btn-group">
                <a href="https://research-paper-assistant-seven.vercel.app/dashboard" class="btn btn-primary" target="_blank">
                    🚀 Open Web Dashboard (UI)
                </a>
                <a href="/docs" class="btn btn-secondary">
                    📖 Interactive API Docs (Swagger)
                </a>
            </div>

            <div class="footer">
                <span>⚡ FastAPI + Uvicorn</span>
                <span>🎓 D.G. Ruparel College</span>
                <span>🤖 Gemini 1.5 + Pinecone</span>
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": "Intelligent Research Paper Assistant"}


# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=TokenResponse, tags=["Authentication"])
async def register(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    is_valid, reason = validate_strong_password(payload.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason or "Password does not meet security requirements."
        )

    clean_email = str(payload.email).strip().lower()
    stmt = select(User).where(User.email == clean_email)
    res = await db.execute(stmt)
    existing_user = res.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        id=uuid.uuid4(),
        email=clean_email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name or clean_email.split("@")[0],
        created_at=datetime.now(timezone.utc)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id), 
            email=user.email, 
            full_name=user.full_name,
            created_at=user.created_at
        )
    )


@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(payload: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = str(payload.email).strip().lower()
    stmt = select(User).where(User.email == clean_email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id), 
            email=user.email, 
            full_name=user.full_name,
            created_at=user.created_at
        )
    )


@app.post("/api/auth/sync", tags=["Authentication"])
async def sync_accounts(accounts: List[dict], db: AsyncSession = Depends(get_db)):
    """Sync frontend local storage accounts into SQLite database."""
    added_count = 0
    for acc in accounts:
        email = acc.get("email", "").strip().lower()
        if not email:
            continue
        stmt = select(User).where(User.email == email)
        res = await db.execute(stmt)
        if not res.scalars().first():
            pw = acc.get("password", "Password@123")
            new_user = User(
                id=uuid.uuid4(),
                email=email,
                password_hash=hash_password(pw),
                full_name=acc.get("fullName", email.split("@")[0]),
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_user)
            added_count += 1
    if added_count > 0:
        await db.commit()
    return {"status": "ok", "synced_users": added_count}


@app.get("/api/auth/users", tags=["Authentication"])
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all registered users."""
    res = await db.execute(select(User))
    users = res.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "created_at": str(u.created_at)
        }
        for u in users
    ]


@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at
    )


def _save_upload_to_disk(file: UploadFile, paper_id: str, contents: bytes) -> str:
    path = os.path.join(UPLOAD_DIR, f"{paper_id}_{file.filename}")
    with open(path, "wb") as f:
        f.write(contents)
    return path


@app.post("/api/papers/upload", tags=["Papers"])
async def upload_paper(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, f"File exceeds the {MAX_UPLOAD_BYTES // (1024*1024)}MB limit.")

    paper_id = str(uuid.uuid4())
    storage_path = _save_upload_to_disk(file, paper_id, contents)

    paper = Paper(
        id=uuid.UUID(paper_id),
        user_id=current_user.id,
        filename=file.filename,
        storage_path=storage_path,
        status=PaperStatus.QUEUED,
        uploaded_at=datetime.now(timezone.utc)
    )
    db.add(paper)
    await db.commit()

    if background_tasks:
        background_tasks.add_task(process_paper_pipeline, paper_id, str(current_user.id), storage_path)

    return {"paper_id": paper_id, "filename": file.filename, "status": "queued"}


async def process_paper_pipeline(paper_id: str, user_id: str, storage_path: str) -> None:
    async with AsyncSessionLocal() as db:
        paper = await db.get(Paper, uuid.UUID(paper_id))
        if not paper:
            return

        paper.status = PaperStatus.PROCESSING
        await db.commit()

        try:
            doc = chunk_document(storage_path)
            paper.page_count = doc.page_count
            vector_ids = upsert_chunks(paper_id, user_id, doc.chunks)

            for chunk, vec_id in zip(doc.chunks, vector_ids):
                db.add(
                    Chunk(
                        paper_id=paper.id,
                        chunk_index=chunk.chunk_index,
                        page_number=chunk.page_number,
                        content=chunk.content,
                        token_count=chunk.token_count,
                        pinecone_vector_id=vec_id,
                    )
                )

            paper.status = PaperStatus.INDEXED
            await db.commit()
        except UnsupportedPdfError as exc:
            paper.status = PaperStatus.UNSUPPORTED
            paper.failure_reason = str(exc)
            await db.commit()
        except Exception as exc:
            logger.error("Processing failed for paper %s: %s", paper_id, exc, exc_info=True)
            paper.status = PaperStatus.FAILED
            paper.failure_reason = str(exc)
            await db.commit()


@app.get("/api/papers", tags=["Papers"])
async def list_papers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Paper).where(Paper.user_id == current_user.id)
    res = await db.execute(stmt)
    return res.scalars().all()


@app.get("/api/papers/{paper_id}", tags=["Papers"])
async def get_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Paper, uuid.UUID(paper_id))
    if paper is None or paper.user_id != current_user.id:
        raise HTTPException(404, "Paper not found.")
    return paper


@app.get("/api/papers/{paper_id}/status", tags=["Papers"])
async def get_paper_status(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Paper, uuid.UUID(paper_id))
    if paper is None or paper.user_id != current_user.id:
        raise HTTPException(404, "Paper not found.")
    return {"status": paper.status, "failure_reason": paper.failure_reason}


@app.post("/api/papers/{paper_id}/query", tags=["RAG"])
async def query_paper(
    paper_id: str,
    payload: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Paper, uuid.UUID(paper_id))
    if paper is None or paper.user_id != current_user.id:
        raise HTTPException(404, "Paper not found.")
    if paper.status != PaperStatus.INDEXED:
        raise HTTPException(409, f"Paper is not ready for querying (status: {paper.status}).")

    result = await answer_question(payload.question, user_id=str(current_user.id), paper_id=paper_id)
    return result


@app.post("/api/library/search", tags=["Search"])
async def cross_paper_search(
    payload: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    results = similarity_search(payload.question, user_id=str(current_user.id), top_k=8)
    return results
