from typing import List, Optional, Any
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field
import datetime

# --- Auth Schemas ---
class UserLoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    role: str = "farmer"
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    center_id: Optional[str] = None
    center_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    profile_completed: bool = True

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    success: bool
    token: str
    user: UserResponse

# --- Center Schemas ---
class CenterBase(BaseModel):
    id: str
    name: str
    district: str
    state: str
    address: str
    operating_hours: str
    commodity: str
    accepted_crops: List[str] = []
    facilities: List[str] = []
    daily_capacity_mt: int
    slot_duration: str
    current_queue_vehicles: int = 0
    estimated_wait_minutes: int = 0
    load_status: str = "low"

class CenterResponse(CenterBase):
    class Config:
        from_attributes = True

class CenterLoadUpdateRequest(BaseModel):
    load_status: str  # 'low', 'medium', 'high'
    current_queue_vehicles: Optional[int] = None
    estimated_wait_minutes: Optional[int] = None

# --- Commodity Schemas ---
class CommodityResponse(BaseModel):
    id: str
    name: str
    name_english: Optional[str] = None
    hindi_name: str
    category: str
    season: str
    unit: str
    demo_rate: float
    msp_per_quintal: float
    moisture_max_percent: float

    class Config:
        from_attributes = True

# --- Booking & Token Schemas ---
class BookingCreateRequest(BaseModel):
    center_id: str
    commodity: str
    booking_date: str
    time_slot: str
    quantity_qtl: float = 40.0
    vehicle_number: str = "HR-05-AB-1234"
    farmer_name: Optional[str] = "Demo Farmer"
    farmer_phone: Optional[str] = "+91 98765 43210"

class BookingResponse(BaseModel):
    id: str
    token_id: str
    farmer_id: Optional[str] = None
    farmer_name: str
    farmer_phone: Optional[str] = None
    center_id: str
    center_name: str
    district: Optional[str] = None
    commodity: str
    booking_date: str
    time_slot: str
    quantity_qtl: float
    vehicle_number: str
    status: str
    arrival_status: str
    queue_position: int

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token_id: str
    booking_id: str
    farmer_name: str
    farmer_phone: Optional[str] = None
    center_id: str
    center_name: str
    commodity: str
    booking_date: str
    time_slot: str
    vehicle_number: str
    status: str
    queue_position: int
    estimated_wait_minutes: int = 0
    qr_payload: str

# --- Queue Schemas ---
class QueueItemResponse(BaseModel):
    id: Optional[int] = None
    booking_id: str
    token_id: str
    center_id: str
    farmer_name: str
    phone: Optional[str] = None
    commodity: str
    time_slot: str
    queue_position: int
    total_vehicles_ahead: int
    estimated_wait_minutes: int
    arrival_status: str
    status: str

    class Config:
        from_attributes = True

class GateVerifyRequest(BaseModel):
    booking_id: str

class QueueAdvanceRequest(BaseModel):
    booking_id: str

class ProcurementActionRequest(BaseModel):
    booking_id: str
    gross_weight: Optional[float] = None
    tare_weight: Optional[float] = None
    moisture_percent: Optional[float] = None

# --- Procurement Record Schemas ---
class ProcurementRecordResponse(BaseModel):
    id: str
    booking_id: str
    token_id: str
    farmer_name: str
    farmer_phone: Optional[str] = None
    center_id: str
    center_name: str
    district: str
    commodity: str
    date: str
    gross_weight: float
    tare_weight: float
    net_weight: float
    moisture_percent: float
    rate_per_qtl: float
    total_amount: float
    payment_status: str

    class Config:
        from_attributes = True

# --- Complaint Schemas ---
class ComplaintCreateRequest(BaseModel):
    complainant_name: str
    complainant_phone: Optional[str] = None
    category: str
    subject: str
    description: str
    center_id: Optional[str] = None
    center_name: Optional[str] = None
    booking_id: Optional[str] = None
    level: str = "OPERATOR"
    priority: str = "MEDIUM"

class ComplaintStatusUpdateRequest(BaseModel):
    status: str  # 'OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED'
    resolution_notes: Optional[str] = None
    level: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    complainant_name: str
    complainant_phone: Optional[str] = None
    category: str
    subject: str
    description: str
    center_id: Optional[str] = None
    center_name: Optional[str] = None
    booking_id: Optional[str] = None
    level: str
    priority: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class AnalyticsOverviewResponse(BaseModel):
    total_centers: int
    active_centers: int
    total_procurement_today_mt: float
    total_farmers_served: int
    queue_congestion_summary: dict
    top_centers: List[dict]
