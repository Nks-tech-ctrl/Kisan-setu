import random
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Complaint
from backend.schemas import ComplaintCreateRequest, ComplaintStatusUpdateRequest

router = APIRouter(prefix="/complaints", tags=["Grievances & Multi-Level Escalation"])

def _format_complaint(c: Complaint) -> dict:
    return {
        "id": c.id,
        "complaintId": c.id,
        "complainantName": c.complainant_name,
        "complainantPhone": c.complainant_phone,
        "category": c.category,
        "subject": c.subject,
        "description": c.description,
        "centerId": c.center_id,
        "centerName": c.center_name,
        "bookingId": c.booking_id,
        "level": c.level,
        "priority": c.priority,
        "status": c.status,
        "resolutionNotes": c.resolution_notes or "",
        "createdAt": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updatedAt": c.updated_at.strftime("%Y-%m-%d %H:%M:%S")
    }

@router.get("")
def list_complaints(
    level: Optional[str] = None,
    status_filter: Optional[str] = None,
    center_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List complaints filtered by governance tier (OPERATOR, DISTRICT_ADMIN, SUPER_ADMIN)
    """
    query = db.query(Complaint)
    if level:
        query = query.filter(Complaint.level == level.strip().upper())
    if status_filter:
        query = query.filter(Complaint.status == status_filter.strip().upper())
    if center_id:
        query = query.filter(Complaint.center_id == center_id.strip().upper())

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return {
        "success": True,
        "total": len(complaints),
        "data": [_format_complaint(c) for c in complaints]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreateRequest, db: Session = Depends(get_db)):
    """
    Submit a new complaint / grievance
    """
    rand_id = f"CMP-2026-{random.randint(100, 999)}"
    cmp = Complaint(
        id=rand_id,
        complainant_name=payload.complainant_name,
        complainant_phone=payload.complainant_phone,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
        center_id=payload.center_id,
        center_name=payload.center_name or "Karnal Central Procurement Center",
        booking_id=payload.booking_id,
        level=payload.level.upper(),
        priority=payload.priority.upper(),
        status="OPEN"
    )
    db.add(cmp)
    db.commit()
    db.refresh(cmp)

    return {
        "success": True,
        "message": f"Complaint {rand_id} successfully lodged.",
        "data": _format_complaint(cmp)
    }

@router.put("/{complaint_id}/status")
def update_complaint_status(complaint_id: str, payload: ComplaintStatusUpdateRequest, db: Session = Depends(get_db)):
    """
    Operator / District Admin / Super Admin update complaint status or escalate
    """
    clean_id = complaint_id.strip().upper()
    cmp = db.query(Complaint).filter(Complaint.id == clean_id).first()
    if not cmp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Complaint {complaint_id} not found.")

    cmp.status = payload.status.upper()
    if payload.resolution_notes is not None:
        cmp.resolution_notes = payload.resolution_notes
    if payload.level:
        cmp.level = payload.level.upper()
    cmp.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(cmp)

    return {
        "success": True,
        "message": f"Complaint {clean_id} updated to '{cmp.status}'.",
        "data": _format_complaint(cmp)
    }
