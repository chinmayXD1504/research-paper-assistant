"""
vector_service.py — Gemini text-embedding-004 generation + Pinecone upsert/query,
namespaced per user with retry/backoff on both external calls.
"""
from __future__ import annotations

import logging
from typing import Optional

from google import genai
from google.genai import types
from pinecone import Pinecone, ServerlessSpec
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import settings
from pdf_processor import ExtractedChunk

logger = logging.getLogger(__name__)

EMBED_MODEL = "text-embedding-004"
EMBED_DIM = 768
UPSERT_BATCH_SIZE = 100

_genai_client: Optional[genai.Client] = None
_cached_api_key: Optional[str] = None


def get_genai_client() -> Optional[genai.Client]:
    global _genai_client, _cached_api_key
    if not settings.GEMINI_API_KEY:
        return None
    if _genai_client is None or _cached_api_key != settings.GEMINI_API_KEY:
        try:
            _genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            _cached_api_key = settings.GEMINI_API_KEY
        except Exception as exc:
            logger.warning("Gemini client initialization error: %s", exc)
            return None
    return _genai_client


def get_pinecone_client() -> Optional[Pinecone]:
    if not settings.PINECONE_API_KEY:
        return None
    try:
        return Pinecone(api_key=settings.PINECONE_API_KEY)
    except Exception as exc:
        logger.warning("Pinecone initialization error: %s", exc)
        return None


def ensure_index() -> None:
    """Idempotent — creates the Pinecone index if it doesn't already exist."""
    pc = get_pinecone_client()
    if not pc:
        return
    try:
        existing = [i["name"] for i in pc.list_indexes()]
        if settings.PINECONE_INDEX_NAME not in existing:
            pc.create_index(
                name=settings.PINECONE_INDEX_NAME,
                dimension=EMBED_DIM,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=settings.PINECONE_REGION),
            )
    except Exception as exc:
        logger.warning("Pinecone ensure_index skipped: %s", exc)


def _index():
    pc = get_pinecone_client()
    if not pc:
        raise RuntimeError("PINECONE_API_KEY is not configured in .env or environment.")
    return pc.Index(settings.PINECONE_INDEX_NAME)


class RetryableEmbeddingError(Exception):
    pass


@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=2, max=20),
    retry=retry_if_exception_type(RetryableEmbeddingError),
    reraise=True,
)
def embed_text(text: str, task_type: str = "retrieval_document") -> list[float]:
    client = get_genai_client()
    if not client:
        raise RetryableEmbeddingError("GEMINI_API_KEY is not configured or client failed to initialize.")
    try:
        config = types.EmbedContentConfig(
            task_type=task_type.upper() if task_type else None
        )
        result = client.models.embed_content(
            model=EMBED_MODEL,
            contents=text,
            config=config,
        )
        if result.embeddings and len(result.embeddings) > 0:
            return result.embeddings[0].values
        raise RetryableEmbeddingError("No embedding returned from Gemini model.")
    except Exception as exc:
        logger.warning("Embedding call failed, will retry: %s", exc)
        raise RetryableEmbeddingError(str(exc)) from exc


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=2, max=20))
def _upsert_batch(vectors: list[dict], namespace: str) -> None:
    _index().upsert(vectors=vectors, namespace=namespace)


def upsert_chunks(paper_id: str, user_id: str, chunks: list[ExtractedChunk]) -> list[str]:
    """Embeds and upserts all chunks for a paper. Returns the Pinecone vector IDs in order."""
    vector_ids: list[str] = []
    batch: list[dict] = []

    for chunk in chunks:
        vec_id = f"{paper_id}_{chunk.chunk_index}"
        try:
            embedding = embed_text(chunk.content, task_type="retrieval_document")
        except Exception:
            embedding = [0.0] * EMBED_DIM

        batch.append(
            {
                "id": vec_id,
                "values": embedding,
                "metadata": {
                    "user_id": user_id,
                    "paper_id": paper_id,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "text": chunk.content[:1000],
                },
            }
        )
        vector_ids.append(vec_id)

        if len(batch) >= UPSERT_BATCH_SIZE:
            try:
                _upsert_batch(batch, namespace=user_id)
            except Exception as exc:
                logger.warning("Pinecone batch upsert skipped: %s", exc)
            batch = []

    if batch:
        try:
            _upsert_batch(batch, namespace=user_id)
        except Exception as exc:
            logger.warning("Pinecone batch upsert skipped: %s", exc)

    return vector_ids


def similarity_search(
    query: str,
    user_id: str,
    paper_id: str | None = None,
    top_k: int = 6,
) -> list[dict]:
    try:
        query_vec = embed_text(query, task_type="retrieval_query")
        filter_ = {"paper_id": paper_id} if paper_id else None
        results = _index().query(
            vector=query_vec,
            top_k=top_k,
            namespace=user_id,
            filter=filter_,
            include_metadata=True,
        )
        return [
            {
                "chunk_id": m["id"],
                "page_number": m["metadata"].get("page_number", 1),
                "content": m["metadata"].get("text", ""),
                "score": m.get("score", 0.9),
            }
            for m in results.get("matches", [])
        ]
    except Exception as exc:
        logger.warning("similarity_search fallback: %s", exc)
        return []


def delete_paper_vectors(paper_id: str, user_id: str) -> None:
    """Called on paper deletion to keep Pinecone in sync with Postgres."""
    try:
        _index().delete(filter={"paper_id": paper_id}, namespace=user_id)
    except Exception as exc:
        logger.warning("Pinecone delete skipped: %s", exc)
