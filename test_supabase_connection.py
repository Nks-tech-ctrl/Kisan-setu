"""
KisanSetu — Supabase Connection Verification Script
Tests PostgreSQL connection, creates tables, and optionally seeds initial data.
"""

import os
import sys
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

def main():
    print("=" * 65)
    print("  * KisanSetu — Supabase Connection Diagnostic")
    print("=" * 65)

    raw_url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not raw_url or not raw_url.strip():
        print("\n[!] No Supabase DATABASE_URL found in .env file.")
        print("\nTo connect KisanSetu to your Supabase PostgreSQL database:")
        print("1. Open your Supabase Dashboard: https://supabase.com/dashboard")
        print("2. Navigate to: Project Settings -> Database -> Connection string -> URI")
        print("3. Copy the URI and replace [YOUR-PASSWORD] with your database password.")
        print("4. Paste it into the '.env' file in this folder:")
        print("   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres")
        print("\nCurrently falling back to local SQLite database (data/kisansetu.db).\n")
        return

    # Check connection
    from backend.database import engine, init_db, IS_SUPABASE
    from backend.models import User, Center, Booking
    from sqlalchemy.orm import Session
    from sqlalchemy import text

    print(f"\nTarget Database: {'Supabase PostgreSQL' if IS_SUPABASE else 'SQLite'}")
    # Mask password for display
    display_url = raw_url
    if "@" in display_url:
        prefix, host = display_url.split("@", 1)
        if ":" in prefix:
            user_part = prefix.split(":")[0]
            display_url = f"{user_part}:****@{host}"
    print(f"Connecting to:   {display_url} ...")

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version_row = result.fetchone()
            print("\n[✓] Connection Successful!")
            if version_row:
                print(f"    Database Version: {version_row[0]}")

        print("\n[✓] Initializing schema (creating tables if not existing)...")
        init_db()
        print("    Tables initialized successfully.")

        # Seed check
        from backend.seed_data import seed_all
        print("\n[✓] Checking and seeding initial demo data...")
        seed_all()

        # Query counts
        from backend.database import SessionLocal
        db: Session = SessionLocal()
        user_count = db.query(User).count()
        center_count = db.query(Center).count()
        booking_count = db.query(Booking).count()
        db.close()

        print(f"\n[✓] Database Status:")
        print(f"    - Users:    {user_count} records")
        print(f"    - Centers:  {center_count} records")
        print(f"    - Bookings: {booking_count} records")
        print("\n" + "=" * 65)
        print("  * KisanSetu is successfully connected to Supabase!")
        print("=" * 65 + "\n")

    except Exception as e:
        print(f"\n[X] Connection Failed: {e}")
        print("\nTroubleshooting tips:")
        print("- Verify your database password is correct.")
        print("- If using standard port 5432 and experiencing timeouts or IPv6 issues, try the Transaction Pooler URI (port 6543) in your Supabase Database settings.")
        print("- Ensure your project is active and not paused in Supabase dashboard.\n")

if __name__ == "__main__":
    main()
