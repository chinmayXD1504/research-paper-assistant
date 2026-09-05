"""
main.py — Complete FastAPI application for the Intelligent Research Paper Assistant.
Implements authentication, multi-column PDF ingestion, Pinecone vector RAG indexing,
grounded Gemini querying, and cross-paper search.
"""
from __future__ import annotations

import logging
import os
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import AsyncSessionLocal, get_db, init_db
from models import Chunk, Paper, PaperStatus, User
from pdf_processor import UnsupportedPdfError, chunk_document
from rag_service import answer_question
from security import create_access_token, get_current_user, hash_password, verify_password
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


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class QueryRequest(BaseModel):
    question: str


from fastapi.responses import HTMLResponse

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
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    existing_user = res.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(id=str(user.id), email=user.email, full_name=user.full_name)
    )


@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == form_data.username)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(id=str(user.id), email=user.email, full_name=user.full_name)
    )


@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name
    )


# --- Paper Management Endpoints ---
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
    if file.content_type != "application/pdf" and not file.filename.endswith(".pdf"):
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
        title=file.filename.replace(".pdf", "").replace("_", " ").title(),
        storage_path=storage_path,
        status=PaperStatus.QUEUED,
    )
    db.add(paper)
    await db.commit()

    if background_tasks:
        background_tasks.add_task(process_paper_pipeline, paper_id, str(current_user.id), storage_path)

    return {
        "paper_id": paper_id,
        "filename": file.filename,
        "title": paper.title,
        "status": "queued"
    }


async def process_paper_pipeline(paper_id: str, user_id: str, storage_path: str) -> None:
    async with AsyncSessionLocal() as db:
        paper = await db.get(Paper, uuid.UUID(paper_id))
        if paper is None:
            logger.error("Paper %s vanished before pipeline ran", paper_id)
            return

        try:
            paper.status = PaperStatus.PROCESSING
            await db.commit()

            chunks = chunk_document(storage_path)

            db_chunks = [
                Chunk(
                    paper_id=paper.id,
                    chunk_index=c.chunk_index,
                    page_number=c.page_number,
                    content=c.content,
                    token_count=c.token_estimate,
                )
                for c in chunks
            ]
            db.add_all(db_chunks)
            await db.flush()

            vector_ids = upsert_chunks(paper_id, user_id, chunks)
            for db_chunk, vec_id in zip(db_chunks, vector_ids):
                db_chunk.pinecone_vector_id = vec_id

            paper.page_count = max((c.page_number for c in chunks), default=1)
            paper.status = PaperStatus.INDEXED
            await db.commit()

        except UnsupportedPdfError as exc:
            paper.status = PaperStatus.UNSUPPORTED
            paper.failure_reason = str(exc)
            await db.commit()
        except Exception as exc:
            logger.exception("Pipeline failed for paper %s", paper_id)
            paper.status = PaperStatus.FAILED
            paper.failure_reason = str(exc)
            await db.commit()


@app.get("/api/papers", tags=["Papers"])
async def list_user_papers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Paper).where(Paper.user_id == current_user.id).order_by(Paper.created_at.desc())
    res = await db.execute(stmt)
    papers = res.scalars().all()
    return papers


@app.get("/api/papers/{paper_id}", tags=["Papers"])
async def get_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    paper = await db.get(Paper, uuid.UUID(paper_id))
    if paper is None or paper.user_id != current_user.id:
        raise HTTPException(404, "Paper not found.")
    return paper


@app.get("/api/papers/{paper_id}/status", tags=["Papers"])
async def paper_status(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Paper, uuid.UUID(paper_id))
    if paper is None or paper.user_id != current_user.id:
        raise HTTPException(404, "Paper not found.")
    return {"status": paper.status, "failure_reason": paper.failure_reason}


@app.delete("/api/papers/{paper_id}", tags=["Papers"])
async def delete_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    paper = await db.get(Paper, uuid.UUID(paper_id))
    if paper is None or paper.user_id != current_user.id:
        raise HTTPException(404, "Paper not found.")

    if os.path.exists(paper.storage_path):
        try:
            os.remove(paper.storage_path)
        except Exception:
            pass

    await db.delete(paper)
    await db.commit()
    return {"message": "Paper successfully deleted"}


# --- RAG & Semantic Search Endpoints ---
@app.post("/api/papers/{paper_id}/query", tags=["RAG Query"])
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


@app.post("/api/library/search", tags=["Semantic Search"])
async def cross_paper_search(
    payload: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    results = similarity_search(
        query=payload.question,
        user_id=str(current_user.id),
        paper_id=None,
        top_k=8
    )
    return {"query": payload.question, "results": results}
