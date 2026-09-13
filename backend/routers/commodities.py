from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Commodity
from backend.schemas import CommodityResponse

router = APIRouter(prefix="/commodities", tags=["Commodities & MSP Rates"])

def _format_commodity(c: Commodity) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "nameEnglish": c.name_english or c.name,
        "hindiName": c.hindi_name,
        "nameHindi": c.hindi_name,
        "category": c.category,
        "season": c.season,
        "unit": c.unit,
        "demoRate": c.demo_rate,
        "mspPerQuintal": c.msp_per_quintal,
        "moistureMaxPercent": c.moisture_max_percent,
        "demoDisclaimer": "डेमो दर • Demo Rate (Illustrative)"
    }

@router.get("")
def list_commodities(category: Optional[str] = None, season: Optional[str] = None, db: Session = Depends(get_db)):
    """
    List all active MSP commodities and benchmark rates
    """
    query = db.query(Commodity)
    if category:
        query = query.filter(Commodity.category.ilike(f"%{category.strip()}%"))
    if season:
        query = query.filter(Commodity.season.ilike(f"%{season.strip()}%"))

    commodities = query.all()
    return {
        "success": True,
        "total": len(commodities),
        "data": [_format_commodity(c) for c in commodities]
    }

@router.get("/{commodity_id}")
def get_commodity(commodity_id: str, db: Session = Depends(get_db)):
    """
    Get commodity details by ID
    """
    com = db.query(Commodity).filter(Commodity.id == commodity_id.strip().upper()).first()
    if not com:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Commodity {commodity_id} not found.")

    return {
        "success": True,
        "data": _format_commodity(com)
    }
