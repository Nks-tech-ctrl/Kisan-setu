import os
import sys
# pyrefly: ignore [missing-import]
import uvicorn

PORT = 8000

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT

    print("=" * 65)
    print("  * [KisanSetu Unified Engine] FastAPI + Frontend Active")
    print("=" * 65)
    print(f"  -> Local URL:        http://localhost:{port}")
    print(f"  -> Direct IP:        http://127.0.0.1:{port}")
    print(f"  -> Swagger Docs:     http://localhost:{port}/docs")
    print(f"  -> Redoc Specs:      http://localhost:{port}/redoc")
    print(f"  -> REST API:         http://localhost:{port}/api/v1")
    from backend.database import IS_SUPABASE
    db_name = "Supabase PostgreSQL" if IS_SUPABASE else "SQLite (data/kisansetu.db)"
    print(f"  -> Database:         {db_name}")
    print("-" * 65)
    print("  Web Portals:")
    print(f"  * Public Landing:    http://localhost:{port}/index.html")
    print(f"  * Farmer Portal:     http://localhost:{port}/farmer/dashboard.html")
    print(f"  * Operator Desk:     http://localhost:{port}/operator/dashboard.html")
    print(f"  * District Admin:    http://localhost:{port}/admin/dashboard.html")
    print(f"  * Super Admin:       http://localhost:{port}/admin/super-admin-dashboard.html")
    print("=" * 65 + "\n")

    # Run Uvicorn ASGI server
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()
