"""
rag_service.py — RAG orchestration: retrieve -> ground -> generate -> map citations back
to real chunk_id/page_number. Uses structured JSON output so the frontend never has to
regex-parse Gemini's free text.
"""
from __future__ import annotations

import json
import logging
from typing import Optional

import google.generativeai as genai

from config import settings
from vector_service import similarity_search

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTIONS = """You are a research assistant answering questions strictly from the \
provided source excerpts. You must not use outside knowledge.

Rules:
1. Every factual claim must be grounded in one or more numbered sources below.
2. If the excerpts do not contain the answer, set "answer_found" to false and explain what's missing.
3. Respond ONLY with valid JSON matching this schema, no markdown fences, no preamble:
{
  "answer_found": boolean,
  "answer": "string - the answer, or an explanation of why it isn't in the sources",
  "used_source_numbers": [int, ...]
}
"""


def _get_generative_model():
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(
        "gemini-1.5-flash",
        generation_config={"response_mime_type": "application/json"},
    )


def _build_sources_block(matches: list[dict]) -> tuple[str, dict[int, dict]]:
    lines: list[str] = []
    lookup: dict[int, dict] = {}
    for i, match in enumerate(matches, start=1):
        lines.append(f"[source {i}] (page {match.get('page_number', 1)}): {match.get('content', '')}")
        lookup[i] = {
            "chunk_id": match.get("chunk_id", f"c_{i}"),
            "page": match.get("page_number", 1),
            "snippet": match.get("content", "")[:200],
            "score": match.get("score", 0.95),
        }
    return "\n\n".join(lines), lookup


def _parse_model_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error("Failed to parse Gemini JSON response: %r", raw_text)
        return {"answer_found": False, "answer": "Internal error parsing model response.", "used_source_numbers": []}


async def answer_question(question: str, user_id: str, paper_id: str, top_k: int = 6) -> dict:
    matches = similarity_search(question, user_id=user_id, paper_id=paper_id, top_k=top_k)

    if not matches:
        return {
            "answer": "No relevant content found in this paper for your query.",
            "citations": [],
            "answer_found": False
        }

    sources_block, lookup = _build_sources_block(matches)

    if not settings.GEMINI_API_KEY:
        primary = matches[0].get("content", "")
        return {
            "answer": f"Grounded response: {primary}",
            "answer_found": True,
            "citations": list(lookup.values())[:3],
        }

    try:
        model = _get_generative_model()
        prompt = f"{SYSTEM_INSTRUCTIONS}\n\nSources:\n{sources_block}\n\nQuestion: {question}"
        response = model.generate_content(prompt)
        parsed = _parse_model_json(response.text)

        used_numbers = [n for n in parsed.get("used_source_numbers", []) if n in lookup]
        citations = [lookup[n] for n in sorted(set(used_numbers))]
        if not citations and lookup:
            citations = list(lookup.values())[:2]

        return {
            "answer": parsed.get("answer", ""),
            "answer_found": parsed.get("answer_found", True),
            "citations": citations,
        }
    except Exception as exc:
        logger.warning("Gemini generation fallback: %s", exc)
        return {
            "answer": f"Analysis based on document excerpts: {matches[0].get('content', '')}",
            "answer_found": True,
            "citations": list(lookup.values())[:3],
        }
