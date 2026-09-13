from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ProcurementRecord
from backend.schemas import ProcurementRecordResponse

router = APIRouter(prefix="/procurement", tags=["Procurement Records & Receipts"])

def _format_receipt(r: ProcurementRecord) -> dict:
    return {
        "receiptId": r.id,
        "id": r.id,
        "bookingId": r.booking_id,
        "tokenId": r.token_id,
        "farmerName": r.farmer_name,
        "farmerPhone": r.farmer_phone,
        "centerId": r.center_id,
        "centerName": r.center_name,
        "district": r.district,
        "commodity": r.commodity,
        "crop": r.commodity,
        "date": r.date,
        "time": "10:30 AM",
        "grossWeight": r.gross_weight,
        "tareWeight": r.tare_weight,
        "netWeight": r.net_weight,
        "moisturePercent": r.moisture_percent,
        "ratePerQtl": r.rate_per_qtl,
        "totalAmount": r.total_amount,
        "paymentStatus": r.payment_status,
        "timestamp": r.receipt_timestamp.strftime("%Y-%m-%d %H:%M:%S")
    }

@router.get("/records")
def list_procurement_records(
    center_id: Optional[str] = None,
    farmer_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List completed crop sales records and weighbridge receipts
    """
    query = db.query(ProcurementRecord)
    if center_id:
        query = query.filter(ProcurementRecord.center_id == center_id.strip().upper())
    if farmer_name:
        query = query.filter(ProcurementRecord.farmer_name.ilike(f"%{farmer_name.strip()}%"))

    records = query.order_by(ProcurementRecord.receipt_timestamp.desc()).all()
    return {
        "success": True,
        "total": len(records),
        "data": [_format_receipt(r) for r in records]
    }

@router.get("/receipts/{receipt_id}")
def get_receipt(receipt_id: str, db: Session = Depends(get_db)):
    """
    Retrieve single digital procurement receipt by Receipt ID, Booking ID, or Token ID
    """
    clean_id = receipt_id.strip().upper()
    receipt = db.query(ProcurementRecord).filter(
        (ProcurementRecord.id == clean_id) |
        (ProcurementRecord.booking_id == clean_id) |
        (ProcurementRecord.token_id == clean_id)
    ).first()

    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Receipt {receipt_id} not found.")

    return {
        "success": True,
        "data": _format_receipt(receipt)
    }
