import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import UserLoginRequest, UserRegisterRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

@router.post("/login", response_model=LoginResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user across all portal roles (farmer, operator, district_admin, super_admin)
    """
    user = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
    if not user or user.password != payload.password.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password."
        )

    # If expected role specified, verify role match
    if payload.role and user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is designated as '{user.role}'. Cannot authenticate into '{payload.role}' portal."
        )

    # Generate a realistic bearer session token
    token = f"kisan_jwt_{user.role}_{uuid.uuid4().hex[:16]}"
    return LoginResponse(
        success=True,
        token=token,
        user=UserResponse.model_validate(user)
    )

@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register_farmer(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new Farmer account
    """
    existing = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"USR-FARMER-{uuid.uuid4().hex[:6].upper()}"
    new_user = User(
        id=user_id,
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password=payload.password.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        role="farmer",
        state=payload.state or "Haryana",
        district=payload.district or "Karnal",
        village=payload.village or "",
        profile_completed=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = f"kisan_jwt_farmer_{uuid.uuid4().hex[:16]}"
    return LoginResponse(
        success=True,
        token=token,
        user=UserResponse.model_validate(new_user)
    )

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """
    Helper endpoint returning mock pre-configured demo credentials for SIH evaluation
    """
    users = db.query(User).all()
    return {
        "success": True,
        "demo_accounts": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "password": u.password,
                "center_name": u.center_name,
                "district": u.district
            }
            for u in users if u.id.startswith("USR-")
        ]
    }
