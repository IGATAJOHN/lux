from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import User
from app.schemas.all_schemas import (
    PinGenerationResponse,
    QrGenerationResponse,
    AccessCredentialsResponse,
    GuestVerifyResponse
)
from app.models.all_models import Booking
from app.routers.auth import get_current_user
from app.services import access_service
from app.core.config import settings
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/generate-pin", response_model=PinGenerationResponse)
def generate_pin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new unique PIN for the current user.
    Returns the plaintext PIN (only shown once).
    """
    # Generate unique PIN
    pin, pin_hash = access_service.generate_unique_pin(db)
    
    # Save to user
    current_user.pin_hash = pin_hash
    db.commit()
    
    return PinGenerationResponse(
        pin=pin,
        message="PIN generated successfully. Save this PIN securely - it will only be shown once."
    )

@router.post("/generate-qr", response_model=QrGenerationResponse)
def generate_qr(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new encrypted QR code for the current user.
    """
    # Calculate expiration
    expiration = datetime.utcnow() + timedelta(days=settings.QR_EXPIRATION_DAYS)
    
    # Generate QR code
    qr_code_base64 = access_service.generate_qr_code(
        user_id=current_user.id,
        unique_id=current_user.unique_id,
        name=current_user.name,
        access_level=current_user.access_level,
        expiration=expiration
    )
    
    # Save to user
    current_user.qr_code_data = qr_code_base64
    current_user.qr_expiration = expiration
    db.commit()
    
    return QrGenerationResponse(
        qr_code_base64=qr_code_base64,
        expiration=expiration,
        message="QR code generated successfully"
    )

@router.get("/my-credentials", response_model=AccessCredentialsResponse)
def get_my_credentials(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's access credentials (PIN status, QR code).
    Note: PIN plaintext is never returned after initial generation.
    """
    return AccessCredentialsResponse(
        user_id=current_user.id,
        access_level=current_user.access_level or "guest",
        has_pin=current_user.pin_hash is not None,
        has_qr_code=current_user.qr_code_data is not None,
        qr_expiration=current_user.qr_expiration,
        qr_code_base64=current_user.qr_code_data if current_user.qr_code_data else None
    )

@router.post("/verify-qr/{token}", response_model=GuestVerifyResponse)
def verify_qr_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify guest QR token and return user info + booking status.
    Public endpoint - no authentication required.
    """
    try:
        # Decrypt and validate token
        payload = access_service.verify_guest_token(token)
        
        # Get user from database
        user = db.query(User).filter(User.id == payload['user_id']).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get active booking (pending, confirmed, or checked_in)
        active_booking = db.query(Booking).filter(
            Booking.user_id == user.id,
            Booking.status.in_(["pending", "confirmed", "checked_in"])
        ).first()
        
        return GuestVerifyResponse(
            user_id=user.id,
            name=user.name,
            unique_id=user.unique_id,
            email=user.email,
            phone=user.phone,
            access_level=user.access_level,
            has_active_booking=active_booking is not None,
            booking_id=active_booking.id if active_booking else None,
            booking_status=active_booking.status if active_booking else None,
            room_number=active_booking.room.room_number if active_booking and active_booking.room else None,
            check_in_date=active_booking.check_in_date if active_booking else None,
            check_out_date=active_booking.check_out_date if active_booking else None,
            payment_status=active_booking.payment_status if active_booking else None,
            amount=active_booking.amount if active_booking else None,
            selfie_image=user.selfie_image
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
