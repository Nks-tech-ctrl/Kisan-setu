from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Center, Booking, QueueEntry, ProcurementRecord, Complaint

router = APIRouter(prefix="/analytics", tags=["District & Super Admin Analytics"])

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    District Admin & Super Admin analytics dashboard intelligence summary
    """
    total_centers = db.query(Center).count()
    active_centers = db.query(Center).filter(Center.current_queue_vehicles > 0).count()
    
    total_bookings = db.query(Booking).count()
    completed_procurements = db.query(ProcurementRecord).count()
    
    # Calculate throughput volume
    all_receipts = db.query(ProcurementRecord).all()
    total_payout = sum(r.total_amount for r in all_receipts)
    total_net_weight = sum(r.net_weight for r in all_receipts)

    # Queue status breakdown
    centers = db.query(Center).all()
    load_counts = {"low": 0, "medium": 0, "high": 0}
    for c in centers:
        load_counts[c.load_status] = load_counts.get(c.load_status, 0) + 1

    # Open grievances count
    open_complaints = db.query(Complaint).filter(Complaint.status.in_(["OPEN", "IN_PROGRESS", "ESCALATED"])).count()

    top_centers = [
        {
            "id": c.id,
            "name": c.name,
            "district": c.district,
            "capacity": c.daily_capacity_mt,
            "queue": c.current_queue_vehicles,
            "loadStatus": c.load_status
        }
        for c in sorted(centers, key=lambda x: x.current_queue_vehicles, reverse=True)[:5]
    ]

    return {
        "success": True,
        "metrics": {
            "totalCenters": total_centers,
            "activeCenters": active_centers,
            "totalBookings": total_bookings,
            "completedProcurements": completed_procurements,
            "totalProcurementWeightQtl": round(total_net_weight, 2),
            "totalDisbursedPayoutINR": round(total_payout, 2),
            "openGrievances": open_complaints,
            "queueCongestion": load_counts
        },
        "topCongestedCenters": top_centers
    }
