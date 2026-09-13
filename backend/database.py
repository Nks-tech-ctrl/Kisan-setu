import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Supabase / PostgreSQL Connection String or SQLite Fallback
RAW_DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("SUPABASE_DB_URL")
    or os.getenv("SUPABASE_POSTGRES_URL")
)

has_valid_pg_url = (
    RAW_DATABASE_URL
    and RAW_DATABASE_URL.strip()
    and not RAW_DATABASE_URL.strip().startswith("sqlite")
    and "[YOUR-PASSWORD]" not in RAW_DATABASE_URL
)

if has_valid_pg_url:
    db_url = RAW_DATABASE_URL.strip()
    # Supabase gives connection strings starting with postgres:// - SQLAlchemy 2.0 requires postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URL = db_url
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    IS_SUPABASE = True
    print("[Database] Engine configured: Supabase PostgreSQL")
else:
    DB_PATH = os.path.join(DATA_DIR, "kisansetu.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    IS_SUPABASE = False
    if RAW_DATABASE_URL and "[YOUR-PASSWORD]" in RAW_DATABASE_URL:
        print("[Database] Note: DATABASE_URL in .env has '[YOUR-PASSWORD]' placeholder. Active engine: Local SQLite (data/kisansetu.db)")
    else:
        print("[Database] Engine configured: Local SQLite (data/kisansetu.db)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI Dependency for database session management"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all database tables in target database (Supabase PostgreSQL or SQLite)"""
    import backend.models  # Ensure models are loaded
    Base.metadata.create_all(bind=engine)
