"""
insert_user_cli.py — Helper to automatically insert a new user directly into research_assistant.db
Usage:
    python insert_user_cli.py <email> <full_name> <password>
"""
import sys
import uuid
import sqlite3
import os
from datetime import datetime, timezone
import bcrypt

# Ensure UTF-8 output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "research_assistant.db")

def insert_user(email: str, full_name: str, password: str):
    clean_email = email.strip().lower()
    if not clean_email or not password:
        print("ERROR: Email and password required")
        sys.exit(1)

    # Hash password with bcrypt
    salt = bcrypt.gensalt()
    pw_hash = bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")
    user_id = str(uuid.uuid4()).replace("-", "")
    created_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Ensure users table exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id CHAR(32) NOT NULL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150),
        created_at DATETIME NOT NULL
    );
    """)

    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (clean_email,))
    row = cursor.fetchone()

    if row:
        # Update existing user info
        cursor.execute("""
            UPDATE users 
            SET password_hash = ?, full_name = ? 
            WHERE LOWER(email) = LOWER(?)
        """, (pw_hash, full_name, clean_email))
        conn.commit()
        print(f"UPDATED: {clean_email}")
    else:
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, full_name, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, clean_email, pw_hash, full_name, created_at))
        conn.commit()
        print(f"INSERTED: {clean_email}")

    conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python insert_user_cli.py <email> <full_name> <password>")
        sys.exit(1)
    insert_user(sys.argv[1], sys.argv[2], sys.argv[3])
