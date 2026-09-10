"""
seed_db.py — Populate research_assistant.db with registered user accounts and benchmark papers
"""
import asyncio
import sys
import uuid
from datetime import datetime, timezone

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import engine, AsyncSessionLocal, init_db
from models import User, Paper, PaperStatus
from security import hash_password

async def seed():
    print("Initializing tables...")
    await init_db()

    async with AsyncSessionLocal() as session:
        users_to_create = [
            {
                "email": "mhatrechinmay1@gmail.com",
                "full_name": "Chinmay Mhatre",
                "password": "Password@123",
            },
            {
                "email": "scholar@research.edu",
                "full_name": "Academic Scholar",
                "password": "Password@123",
            },
            {
                "email": "chinmay.mhatre@ruparel.edu",
                "full_name": "Chinmay Chandravadan Mhatre",
                "password": "Password@123",
            }
        ]

        created_users = {}
        for u in users_to_create:
            stmt = select(User).where(User.email == u["email"])
            existing = (await session.execute(stmt)).scalars().first()
            if not existing:
                new_user = User(
                    id=uuid.uuid4(),
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    full_name=u["full_name"],
                    created_at=datetime.now(timezone.utc)
                )
                session.add(new_user)
                await session.flush()
                created_users[u["email"]] = new_user
                print(f"[+] Added User: {u['full_name']} ({u['email']})")
            else:
                created_users[u["email"]] = existing
                print(f"[*] User already exists: {u['email']}")

        # Seed sample benchmark papers for primary user
        primary_user = created_users.get("mhatrechinmay1@gmail.com") or created_users.get("scholar@research.edu")
        if primary_user:
            res_p = await session.execute(select(Paper).where(Paper.user_id == primary_user.id))
            if not res_p.scalars().first():
                sample_papers = [
                    Paper(
                        id=uuid.uuid4(),
                        user_id=primary_user.id,
                        title="Attention Is All You Need",
                        authors=["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
                        filename="attention_is_all_you_need.pdf",
                        storage_path="./uploads/attention_is_all_you_need.pdf",
                        status=PaperStatus.INDEXED,
                        page_count=15,
                        summary="The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
                        key_findings=["Self-attention enables superior parallelization", "BLEU score of 28.4 on WMT 2014 English-to-German", "Drastic reduction in training time compared to RNNs"],
                        methodology="Multi-Head Self-Attention with Positional Encoding and scaled dot-product attention.",
                        limitations="Quadratic computational and memory complexity with respect to sequence length.",
                        uploaded_at=datetime.now(timezone.utc)
                    ),
                    Paper(
                        id=uuid.uuid4(),
                        user_id=primary_user.id,
                        title="BERT: Pre-training of Deep Bidirectional Transformers",
                        authors=["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
                        filename="bert_paper.pdf",
                        storage_path="./uploads/bert_paper.pdf",
                        status=PaperStatus.INDEXED,
                        page_count=16,
                        summary="We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text.",
                        key_findings=["Masked Language Model (MLM) enables bidirectional context", "New state-of-the-art results on 11 natural language processing tasks", "GLUE score improved to 80.5%"],
                        methodology="Masked LM and Next Sentence Prediction on BookCorpus and Wikipedia.",
                        limitations="High pre-training computational cost and mask token mismatch in fine-tuning.",
                        uploaded_at=datetime.now(timezone.utc)
                    )
                ]
                for p in sample_papers:
                    session.add(p)
                    print(f"[+] Added Benchmark Paper: '{p.title}'")

        await session.commit()
        print("\nSUCCESS: Database seeded with user accounts and papers!")

if __name__ == "__main__":
    asyncio.run(seed())
