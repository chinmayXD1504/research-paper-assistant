"""
view_db.py — Quick CLI utility to view tables and records in research_assistant.db
Usage:
    python view_db.py
"""
import sqlite3
import os
import sys

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DB_FILE = "research_assistant.db"

def inspect_database():
    if not os.path.exists(DB_FILE):
        print(f"[!] Database file '{DB_FILE}' does not exist yet.")
        print("    Run 'python -c \"import asyncio, database; asyncio.run(database.init_db())\"' to create it.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Fetch list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    print("\n" + "=" * 65)
    print("  DATABASE VIEWER: research_assistant.db")
    print("=" * 65)

    if not tables:
        print("No tables found in database. Run the backend to initialize tables.")
        return

    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]

        cursor.execute(f"PRAGMA table_info({table});")
        columns = [col[1] for col in cursor.fetchall()]

        print(f"\n[TABLE] {table.upper()} -- ({count} records)")
        print("   Columns: " + ", ".join(columns))

        if count > 0:
            cursor.execute(f"SELECT * FROM {table} LIMIT 3")
            rows = cursor.fetchall()
            print("   Sample Rows:")
            for r in rows:
                print(f"   -> {r}")
        else:
            print("   Status: Clean / Empty (Ready for data)")

    print("\n" + "=" * 65 + "\n")
    conn.close()

if __name__ == "__main__":
    inspect_database()
