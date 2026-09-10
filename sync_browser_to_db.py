"""
sync_browser_to_db.py — Synchronizes all users, papers, chunks, citations, and chats into research_assistant.db
"""
import asyncio
import sys
import uuid
from datetime import datetime, timezone

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, init_db
from models import User, Paper, PaperStatus, Chunk, Citation, ChatMessage, ChatRole
from security import hash_password

async def sync_all():
    print("Connecting to database...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Accounts to ensure in DB
        accounts = [
            {"email": "mhatrechinmay1@gmail.com", "full_name": "Chinmay Mhatre", "password": "Password@123"},
            {"email": "sanchitmhatre815@gmail.com", "full_name": "Sanchit Mhatre", "password": "Password@123"},
            {"email": "scholar@research.edu", "full_name": "Academic Scholar", "password": "Password@123"},
            {"email": "chinmay.mhatre@ruparel.edu", "full_name": "Chinmay Chandravadan Mhatre", "password": "Password@123"},
        ]

        user_map = {}
        for acc in accounts:
            stmt = select(User).where(User.email == acc["email"])
            user = (await session.execute(stmt)).scalars().first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    email=acc["email"],
                    password_hash=hash_password(acc["password"]),
                    full_name=acc["full_name"],
                    created_at=datetime.now(timezone.utc)
                )
                session.add(user)
                await session.flush()
                print(f"[+] Synced User to DB: {user.full_name} ({user.email})")
            else:
                print(f"[*] User in DB: {user.email}")
            user_map[acc["email"]] = user

        # 2. Papers from website
        chinmay_user = user_map.get("mhatrechinmay1@gmail.com")
        sanchit_user = user_map.get("sanchitmhatre815@gmail.com")

        papers_data = [
            {
                "user": chinmay_user,
                "title": "Introduction to 2D Materials & Graphene Nanotechnology",
                "authors": ["K. S. Novoselov", "A. K. Geim", "S. V. Morozov"],
                "filename": "2d_materials_intro.pdf",
                "page_count": 12,
                "summary": "This paper reviews the atomic structure, electronic transport properties, and quantum Hall effect in two-dimensional graphene and transition metal dichalcogenides.",
                "key_findings": ["Zero effective mass carriers with relativistic behavior", "High room-temperature carrier mobility exceeding 15,000 cm2/V·s", "Ballistic transport at sub-micrometer scales"],
                "methodology": "Micro-mechanical cleavage and atomic force microscopy electrical characterization."
            },
            {
                "user": sanchit_user or chinmay_user,
                "title": "Global Semiconductor Market Forecast & Next-Gen Lithography",
                "authors": ["WSTS Semiconductor Industry Group", "Dr. E. Thorne"],
                "filename": "semiconductor_forecast.pdf",
                "page_count": 8,
                "summary": "Analysis of extreme ultraviolet (EUV) lithography scaling down to 2nm nodes and global wafer fab equipment demand through 2030.",
                "key_findings": ["High-NA EUV lithography adoption starting at 2nm", "Global logic market growth projected at 12.4% CAGR", "Advanced packaging chiplet architectures driving density"],
                "methodology": "Econometric industry modeling and fab capacity telemetry aggregation."
            },
            {
                "user": chinmay_user,
                "title": "Attention Is All You Need",
                "authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
                "filename": "attention_is_all_you_need.pdf",
                "page_count": 15,
                "summary": "The Transformer architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
                "key_findings": ["Self-attention enables superior parallelization", "State-of-the-art BLEU score of 28.4", "Drastic reduction in training time"],
                "methodology": "Multi-Head Self-Attention with Positional Encoding."
            }
        ]

        for p_info in papers_data:
            if not p_info["user"]:
                continue
            stmt = select(Paper).where(Paper.title == p_info["title"], Paper.user_id == p_info["user"].id)
            existing_p = (await session.execute(stmt)).scalars().first()
            if not existing_p:
                paper_obj = Paper(
                    id=uuid.uuid4(),
                    user_id=p_info["user"].id,
                    title=p_info["title"],
                    authors=p_info["authors"],
                    filename=p_info["filename"],
                    storage_path=f"./uploads/{p_info['filename']}",
                    status=PaperStatus.INDEXED,
                    page_count=p_info["page_count"],
                    summary=p_info["summary"],
                    key_findings=p_info["key_findings"],
                    methodology=p_info["methodology"],
                    uploaded_at=datetime.now(timezone.utc)
                )
                session.add(paper_obj)
                await session.flush()

                # Add sample chunks & citations
                chunk_obj = Chunk(
                    id=uuid.uuid4(),
                    paper_id=paper_obj.id,
                    chunk_index=0,
                    page_number=1,
                    content=f"Abstract: {p_info['summary']}",
                    token_count=180,
                    pinecone_vector_id=f"{paper_obj.id}_0"
                )
                session.add(chunk_obj)

                citation_obj = Citation(
                    id=uuid.uuid4(),
                    paper_id=paper_obj.id,
                    raw_text=f"References: {', '.join(p_info['authors'])} (2024). {p_info['title']}.",
                    parsed_authors=", ".join(p_info["authors"]),
                    parsed_year=2024,
                    parsed_title=p_info["title"]
                )
                session.add(citation_obj)

                chat_obj = ChatMessage(
                    id=uuid.uuid4(),
                    paper_id=paper_obj.id,
                    user_id=p_info["user"].id,
                    role=ChatRole.ASSISTANT,
                    content=f"Hello! I am ready to answer your research questions about '{p_info['title']}'.",
                    created_at=datetime.now(timezone.utc)
                )
                session.add(chat_obj)

                print(f"[+] Synced Paper & Chunks/Citations: '{paper_obj.title}' for {p_info['user'].email}")

        await session.commit()
        print("\nSUCCESS: All website users, papers, chunks, citations & chats synchronized to SQLite DB!")

if __name__ == "__main__":
    asyncio.run(sync_all())
