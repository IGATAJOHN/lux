from sqlalchemy.orm import Session
from app.models.all_models import Booking, Room
from app.schemas.all_schemas import BookingCreate
from app.utils.ai_mock import mock_fraud_score

def create_booking(db: Session, booking: BookingCreate, user_id: int):
    # AI Checks
    fraud_result = mock_fraud_score({"user_id": user_id})
    
    if fraud_result["risk_level"] == "HIGH":
        return None, "Booking rejected due to high fraud risk"

    # Calculate booking amount based on room type pricing
    nights = (booking.check_out_date - booking.check_in_date).days
    
    # Get price from DB based on room type
    room = db.query(Room).filter(
        Room.room_type == booking.room_type,
        Room.status == "available"
    ).first()
    
    if not room:
        return None, f"No available rooms of type '{booking.room_type}'"
    
    amount = room.price_per_night * nights

    new_booking = Booking(
        user_id=user_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        room_type=booking.room_type,
        preferences=booking.preferences,
        amount=amount,
        status="pending",
        fraud_score=fraud_result["score"]
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking, None

def confirm_booking(db: Session, booking_id: int):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return None
    
    available_room = db.query(Room).filter(Room.status == "available").first()
    if available_room:
        booking.room_id = available_room.id
        available_room.status = "occupied"
    
    booking.status = "confirmed"
    db.commit()
    return booking
