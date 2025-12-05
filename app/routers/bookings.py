from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.all_models import Booking, User, Room
from app.schemas.all_schemas import BookingCreate, BookingResponse
from app.routers.auth import get_current_user
from app.utils.ai_mock import mock_fraud_score, mock_anomaly_detection
from app.services import payment_service

router = APIRouter()

@router.get("/", response_model=List[BookingResponse])
def get_bookings(guest_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Booking)
    if guest_id:
        # If admin or querying own bookings
        if current_user.role != "admin" and current_user.id != guest_id:
             raise HTTPException(status_code=403, detail="Not authorized")
        query = query.filter(Booking.user_id == guest_id)
    elif current_user.role != "admin":
        # If not admin and no specific guest_id, return own bookings
        query = query.filter(Booking.user_id == current_user.id)
    
    return query.all()

from app.services import booking_service

@router.post("/create", response_model=BookingResponse)
def create_booking(booking: BookingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_booking, error = booking_service.create_booking(db, booking, current_user.id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return new_booking

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return booking

@router.post("/payment/initialize/{booking_id}")
def initialize_payment(booking_id: int, db: Session = Depends(get_db)):
    """
    Initialize Paystack payment for a booking.
    Returns Paystack authorization URL for user to complete payment.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")
    
    try:
        result = payment_service.initialize_paystack_payment(booking, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payment/verify/{reference}")
def verify_payment(reference: str, db: Session = Depends(get_db)):
    """
    Verify Paystack payment using reference.
    Called by frontend after payment completion.
    """
    try:
        result = payment_service.verify_paystack_payment(reference, db)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/confirm/{booking_id}")
def confirm_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if payment has been made
    if booking.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Payment required before confirmation")
    
    # Auto-assign room logic (simplified)
    available_room = db.query(Room).filter(
        Room.status == "available",
        Room.room_type == booking.check_in_date  # This should actually filter by room_type from booking
    ).first()
    
    # Fallback: just get any available room
    if not available_room:
        available_room = db.query(Room).filter(Room.status == "available").first()
    
    if available_room:
        booking.room_id = available_room.id
        available_room.status = "occupied"
    else:
        raise HTTPException(status_code=400, detail="No rooms available")
    
    booking.status = "confirmed"
    db.commit()
    db.refresh(booking)
    return {"message": "Booking confirmed", "room_number": booking.room.room_number if booking.room else None}

@router.post("/checkin/{booking_id}")
def check_in(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "checked_in"
    db.commit()
    return {"message": "Checked in successfully"}

@router.post("/checkout/{booking_id}")
def check_out(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "checked_out"
    if booking.room:
        booking.room.status = "dirty"
    db.commit()
    return {"message": "Checked out successfully"}
