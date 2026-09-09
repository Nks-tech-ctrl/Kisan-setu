import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from backend.database import init_db
from backend.seed_data import seed_all
from backend.routers import (
    auth,
    centers,
    commodities,
    bookings,
    queue,
    procurement,
    complaints,
    analytics,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app = FastAPI(
    title="KisanSetu Platform API",
    description="Smart Agricultural Procurement & Queue Intelligence Platform — RESTful Microservice",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# Enable universal CORS for frictionless local and network interactions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers under /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1")
app.include_router(centers.router, prefix="/api/v1")
app.include_router(commodities.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(queue.router, prefix="/api/v1")
app.include_router(procurement.router, prefix="/api/v1")
app.include_router(complaints.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    """Ensure database schema is created and seeded with realistic demo data on startup"""
    init_db()
    seed_all()

@app.get("/api/v1/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "KisanSetu Backend Engine",
        "version": "1.0.0",
        "database": "SQLite (data/kisansetu.db)",
        "docs": "/docs"
    }

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    svg_path = os.path.join(FRONTEND_DIR, "assets", "logo.svg")
    if os.path.exists(svg_path):
        return FileResponse(svg_path, media_type="image/svg+xml")
    return {"error": "favicon not found"}

# Mount frontend static directory at root
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
