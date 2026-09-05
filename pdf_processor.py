"""
pdf_processor.py — Text extraction (multi-column aware) + semantic chunking with
page-number preservation. pdfplumber primary, pypdf fallback for sparse extraction.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import pdfplumber
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

MIN_CHARS_PER_PAGE_THRESHOLD = 20  # below this, treat page as "sparse" -> trigger fallback
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


@dataclass
class ExtractedChunk:
    content: str
    page_number: int
    chunk_index: int
    token_estimate: int


class UnsupportedPdfError(ValueError):
    """Raised when no extractable text is found (e.g. scanned/image-only PDF)."""


def _extract_with_pdfplumber(file_path: str) -> list[tuple[int, str]]:
    pages: list[tuple[int, str]] = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text(layout=True) or page.extract_text() or ""
            pages.append((i, text))
    return pages


def _extract_with_pypdf(file_path: str) -> list[tuple[int, str]]:
    reader = PdfReader(file_path)
    return [(i, page.extract_text() or "") for i, page in enumerate(reader.pages, start=1)]


def extract_pages(file_path: str) -> list[tuple[int, str]]:
    """
    Returns [(page_number, raw_text)] for pages containing usable text.
    Falls back to pypdf if pdfplumber extraction looks sparse (common with
    certain multi-column academic layouts or embedded-font quirks).
    """
    pages = _extract_with_pdfplumber(file_path)
    total_chars = sum(len(t) for _, t in pages)
    avg_chars = total_chars / max(len(pages), 1)

    if avg_chars < MIN_CHARS_PER_PAGE_THRESHOLD:
        logger.warning("pdfplumber extraction sparse (avg %.1f chars/page); falling back to pypdf", avg_chars)
        pages = _extract_with_pypdf(file_path)

    return [(n, t) for n, t in pages if t.strip()]


def chunk_document(file_path: str) -> list[ExtractedChunk]:
    pages = extract_pages(file_path)
    if not pages:
        raise UnsupportedPdfError(
            "No extractable text found — this looks like a scanned or image-only PDF, "
            "which is out of scope for this release."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " "],
    )

    chunks: list[ExtractedChunk] = []
    idx = 0
    for page_number, text in pages:
        for piece in splitter.split_text(text):
            piece = piece.strip()
            if not piece:
                continue
            chunks.append(
                ExtractedChunk(
                    content=piece,
                    page_number=page_number,
                    chunk_index=idx,
                    token_estimate=max(len(piece) // 4, 1),
                )
            )
            idx += 1

    if not chunks:
        raise UnsupportedPdfError("Text was extracted but produced zero usable chunks after cleaning.")

    return chunks
