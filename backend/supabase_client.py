import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("SUPABASE_PROJECT_URL", "https://ycnrpxhzjnybpsgsjrbf.supabase.co")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_O4RgEPNxK3uRTrsyYhKasg_NKZvLZtb")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "sb_secret_3lTH8ZoPalSlCzHeI3gNUg_UmWrQyY8")
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "https://ycnrpxhzjnybpsgsjrbf.supabase.co/auth/v1/.well-known/jwks.json")

SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or SUPABASE_PUBLISHABLE_KEY
    or os.getenv("SUPABASE_ANON_KEY")
    or SUPABASE_SECRET_KEY
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
)

_supabase_client = None

def get_supabase_client():
    """
    Returns an initialized Supabase client instance if credentials are configured.
    Returns None if SUPABASE_URL or SUPABASE_KEY are not present.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    try:
        # pyrefly: ignore [missing-import]
        from supabase import create_client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _supabase_client
    except Exception as e:
        print(f"[Supabase Client Error]: Could not initialize Supabase client: {e}")
        return None
