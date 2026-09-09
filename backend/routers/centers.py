import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Center
from backend.schemas import CenterResponse, CenterLoadUpdateRequest

router = APIRouter(prefix="/centers", tags=["Procurement Centers"])

def _format_center(c: Center) -> dict:
    try:
        accepted_crops = json.loads(c.accepted_crops) if c.accepted_crops else []
    except Exception:
        accepted_crops = [c.commodity]
    
    try:
        facilities = json.loads(c.facilities) if c.facilities else []
    except Exception:
        facilities = ["डिजिटल टोकन", "वेईब्रिज", "किसान प्रतीक्षालय"]

    return {
        "id": c.id,
        "centerId": c.id,
        "name": c.name,
        "district": c.district,
        "state": c.state,
        "address": c.address,
        "operatingHours": c.operating_hours,
        "commodity": c.commodity,
        "commodities": accepted_crops,
        "acceptedCrops": accepted_crops,
        "facilities": facilities,
        "dailyCapacityMT": c.daily_capacity_mt,
        "dailyCapacity": f"{c.daily_capacity_mt} MT / दिन",
        "slotDuration": c.slot_duration,
        "currentQueueVehicles": c.current_queue_vehicles,
        "estimatedWaitMinutes": c.estimated_wait_minutes,
        "loadStatus": c.load_status
    }

@router.get("")
def list_centers(
    district: Optional[str] = None,
    state: Optional[str] = None,
    commodity: Optional[str] = None,
    load_status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all procurement centers with rich filtering and queue intelligence
    """
    query = db.query(Center)

    if district:
        query = query.filter(Center.district.ilike(f"%{district.strip()}%"))
    if state:
        query = query.filter(Center.state.ilike(f"%{state.strip()}%"))
    if load_status:
        query = query.filter(Center.load_status == load_status.strip().lower())
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            (Center.name.ilike(search)) |
            (Center.district.ilike(search)) |
            (Center.commodity.ilike(search)) |
            (Center.address.ilike(search))
        )

    centers = query.all()
    results = [_format_center(c) for c in centers]

    # Additional crop filter if requested
    if commodity:
        c_lower = commodity.strip().lower()
        results = [
            r for r in results
            if any(c_lower in crop.lower() for crop in r["acceptedCrops"]) or c_lower in r["commodity"].lower()
        ]

    return {
        "success": True,
        "total": len(results),
        "data": results
    }

@router.get("/{center_id}")
def get_center_details(center_id: str, db: Session = Depends(get_db)):
    """
    Retrieve single procurement center by ID
    """
    center = db.query(Center).filter(Center.id == center_id.strip().upper()).first()
    if not center:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Center {center_id} not found.")

    return {
        "success": True,
        "data": _format_center(center)
    }

@router.put("/{center_id}/load")
def update_center_load(center_id: str, payload: CenterLoadUpdateRequest, db: Session = Depends(get_db)):
    """
    Operator/Admin update center yard load conditions and wait times
    """
    center = db.query(Center).filter(Center.id == center_id.strip().upper()).first()
    if not center:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Center {center_id} not found.")

    center.load_status = payload.load_status.lower()
    if payload.current_queue_vehicles is not None:
        center.current_queue_vehicles = payload.current_queue_vehicles
    if payload.estimated_wait_minutes is not None:
        center.estimated_wait_minutes = payload.estimated_wait_minutes

    db.commit()
    db.refresh(center)

    return {
        "success": True,
        "message": f"Center load updated to '{center.load_status}'",
        "data": _format_center(center)
    }
