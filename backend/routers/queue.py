import random
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import QueueEntry, Booking, Center, ProcurementRecord
from backend.schemas import GateVerifyRequest, QueueAdvanceRequest, ProcurementActionRequest

router = APIRouter(prefix="/queue", tags=["Live Queue & Yard Intelligence"])

def _format_queue_item(q: QueueEntry) -> dict:
    return {
        "bookingId": q.booking_id,
        "tokenId": q.token_id,
        "centerId": q.center_id,
        "farmerName": q.farmer_name,
        "phone": q.phone,
        "commodity": q.commodity,
        "timeSlot": q.time_slot,
        "queuePosition": q.queue_position,
        "totalVehiclesAhead": q.total_vehicles_ahead,
        "estimatedWaitMinutes": q.estimated_wait_minutes,
        "arrivalStatus": q.arrival_status,
        "status": q.status
    }

@router.get("/{center_id}")
def get_center_queue(center_id: str, db: Session = Depends(get_db)):
    """
    Get live queue items for a procurement center
    """
    clean_id = center_id.strip().upper()
    entries = (
        db.query(QueueEntry)
        .filter(QueueEntry.center_id == clean_id)
        .order_by(QueueEntry.queue_position.asc())
        .all()
    )

    all_items = [_format_queue_item(e) for e in entries]

    # Calculate summary metrics
    today_bookings = len(all_items)
    arrived = sum(1 for e in all_items if e["arrivalStatus"] in ["arrived", "checked_in"])
    in_queue = sum(1 for e in all_items if e["arrivalStatus"] == "checked_in" and e["queuePosition"] > 0)
    in_progress = sum(1 for e in all_items if e["queuePosition"] == 0 and "खरीद पूर्ण" not in e["status"])
    completed = sum(1 for e in all_items if "खरीद पूर्ण" in e["status"])

    return {
        "success": True,
        "centerId": clean_id,
        "metrics": {
            "todayBookings": today_bookings,
            "arrivedFarmers": arrived,
            "waitingInQueue": in_queue,
            "inProgress": in_progress,
            "completed": completed
        },
        "data": all_items
    }

@router.post("/gate-checkin")
def gate_checkin(payload: GateVerifyRequest, db: Session = Depends(get_db)):
    """
    Operator gate terminal: Verify vehicle arrival and register into yard queue
    """
    clean_id = payload.booking_id.strip().upper()
    booking = db.query(Booking).filter((Booking.id == clean_id) | (Booking.token_id == clean_id)).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    booking.arrival_status = "checked_in"
    booking.status = "गेट सत्यापन पूर्ण (Gate Verified)"

    queue_entry = db.query(QueueEntry).filter(QueueEntry.booking_id == booking.id).first()
    if not queue_entry:
        queue_entry = QueueEntry(
            booking_id=booking.id,
            token_id=booking.token_id,
            center_id=booking.center_id,
            farmer_name=booking.farmer_name,
            phone=booking.farmer_phone,
            commodity=booking.commodity,
            time_slot=booking.time_slot,
            queue_position=5,
            total_vehicles_ahead=4,
            estimated_wait_minutes=20,
            arrival_status="checked_in",
            status="गेट सत्यापन पूर्ण (Gate Verification Complete)"
        )
        db.add(queue_entry)
    else:
        queue_entry.arrival_status = "checked_in"
        queue_entry.status = "गेट सत्यापन पूर्ण (Gate Verification Complete)"
        queue_entry.queue_position = min(queue_entry.queue_position, 5)

    db.commit()
    db.refresh(queue_entry)

    return {
        "success": True,
        "message": f"Gate verified successfully for {booking.farmer_name} ({booking.token_id}).",
        "data": _format_queue_item(queue_entry)
    }

@router.post("/advance")
def advance_queue(payload: QueueAdvanceRequest, db: Session = Depends(get_db)):
    """
    Advance vehicle queue sequence number towards weighbridge
    """
    clean_id = payload.booking_id.strip().upper()
    queue_entry = db.query(QueueEntry).filter(
        (QueueEntry.booking_id == clean_id) | (QueueEntry.token_id == clean_id)
    ).first()

    if not queue_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue entry not found.")

    new_pos = max(0, queue_entry.queue_position - 1)
    queue_entry.queue_position = new_pos
    queue_entry.total_vehicles_ahead = max(0, new_pos - 1)
    queue_entry.estimated_wait_minutes = new_pos * 5

    if new_pos == 1:
        queue_entry.status = "आपकी बारी जल्द है (Your Turn Is Next)"
    elif new_pos == 0:
        queue_entry.status = "खरीद प्रक्रिया में (Procurement in Progress)"
    else:
        queue_entry.status = "कतार में प्रतीक्षा (Waiting in Queue)"

    # Update corresponding booking
    booking = db.query(Booking).filter(Booking.id == queue_entry.booking_id).first()
    if booking:
        booking.queue_position = new_pos
        if new_pos == 0:
            booking.status = "IN_PROGRESS"

    db.commit()
    db.refresh(queue_entry)

    return {
        "success": True,
        "message": f"Queue position advanced for {queue_entry.farmer_name} (Now #{new_pos}).",
        "data": _format_queue_item(queue_entry)
    }

@router.post("/complete-procurement")
def complete_procurement(payload: ProcurementActionRequest, db: Session = Depends(get_db)):
    """
    Finalize weighbridge records, mark queue complete, and issue digital receipt
    """
    clean_id = payload.booking_id.strip().upper()
    booking = db.query(Booking).filter((Booking.id == clean_id) | (Booking.token_id == clean_id)).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    booking.status = "COMPLETED"
    booking.queue_position = 0

    # Update queue entry
    queue_entry = db.query(QueueEntry).filter(QueueEntry.booking_id == booking.id).first()
    if queue_entry:
        queue_entry.queue_position = 0
        queue_entry.total_vehicles_ahead = 0
        queue_entry.estimated_wait_minutes = 0
        queue_entry.status = "खरीद पूर्ण (Procurement Completed)"

    # Generate Digital Receipt
    rand_num = random.randint(1000, 9999)
    receipt_id = f"KSP-RCP-{rand_num}"
    gross = payload.gross_weight or (booking.quantity_qtl + 5.7)
    tare = payload.tare_weight or 5.7
    net = round(gross - tare, 2)
    rate = 2425.0
    total_amount = round(net * rate, 2)

    receipt = ProcurementRecord(
        id=receipt_id,
        booking_id=booking.id,
        token_id=booking.token_id,
        farmer_name=booking.farmer_name,
        farmer_phone=booking.farmer_phone,
        center_id=booking.center_id,
        center_name=booking.center_name,
        district=booking.district or "Karnal",
        commodity=booking.commodity,
        date=datetime.date.today().strftime("%d-%m-%Y"),
        gross_weight=gross,
        tare_weight=tare,
        net_weight=net,
        moisture_percent=payload.moisture_percent or 10.2,
        rate_per_qtl=rate,
        total_amount=total_amount,
        payment_status="PAID"
    )
    db.add(receipt)
    db.commit()

    return {
        "success": True,
        "message": f"Procurement successfully completed. Digital receipt {receipt_id} generated.",
        "receiptId": receipt_id,
        "data": {
            "receiptId": receipt_id,
            "bookingId": booking.id,
            "tokenId": booking.token_id,
            "farmerName": booking.farmer_name,
            "netWeight": net,
            "totalAmount": total_amount,
            "paymentStatus": "PAID"
        }
    }
