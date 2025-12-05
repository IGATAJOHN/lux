from sqlalchemy.orm import Session
from app.models.all_models import Booking, Room
from app.core.config import settings
from datetime import datetime
import requests

def initialize_paystack_payment(booking: Booking, db: Session) -> dict:
    """
    Initialize Paystack payment transaction.
    Returns authorization URL for user to complete payment.
    """
    if not booking.amount:
        # Calculate amount based on room type pricing (before room assignment)
        nights = (booking.check_out_date - booking.check_in_date).days
        
        # Get price from DB based on room type
        room = db.query(Room).filter(Room.room_type == booking.room_type).first()
        if not room:
            # Fallback or error if room type not found
            # For now, let's assume if type exists, at least one room exists.
            # Ideally we should have a RoomType model but we use Room for pricing
             raise Exception(f"Invalid room type: {booking.room_type}")

        price_per_night = room.price_per_night
        booking.amount = price_per_night * nights
        db.commit()
    
    # Paystack amount is in kobo (multiply by 100)
    amount_in_kobo = int(booking.amount * 100)
    
    # Initialize Paystack transaction
    url = "https://api.paystack.co/transaction/initialize"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "email": booking.user.email,
        "amount": amount_in_kobo,
        "reference": f"BOOKING_{booking.id}_{datetime.utcnow().timestamp()}",
        "callback_url": f"{settings.FRONTEND_URL}/payment/callback",
        "metadata": {
            "booking_id": booking.id,
            "user_id": booking.user_id,
            "user_name": booking.user.name
        }
    }
    
    response = requests.post(url, json=payload, headers=headers)
    result = response.json()
    
    if result.get("status"):
        # Save reference for verification
        booking.transaction_id = payload["reference"]
        db.commit()
        
        return {
            "success": True,
            "authorization_url": result["data"]["authorization_url"],
            "access_code": result["data"]["access_code"],
            "reference": payload["reference"]
        }
    else:
        raise Exception(result.get("message", "Payment initialization failed"))

def verify_paystack_payment(reference: str, db: Session) -> dict:
    """
    Verify Paystack payment using reference.
    Returns payment verification result.
    """
    url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"
    }
    
    response = requests.get(url, headers=headers)
    result = response.json()
    
    if result.get("status") and result["data"]["status"] == "success":
        # Update booking payment status
        booking_id = result["data"]["metadata"]["booking_id"]
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        
        if booking:
            booking.payment_status = "paid"
            booking.payment_date = datetime.utcnow()
            booking.transaction_id = reference
            booking.amount = result["data"]["amount"] / 100  # Convert from kobo
            db.commit()
            
            return {
                "success": True,
                "message": "Payment verified successfully",
                "amount": booking.amount,
                "booking_id": booking_id
            }
    
    return {
        "success": False,
        "message": "Payment verification failed"
    }

def calculate_booking_amount(booking: Booking) -> float:
    """
    Calculate total booking amount based on room rate and number of nights.
    """
    if not booking.room or not booking.room.price_per_night:
        return 0.0
    
    nights = (booking.check_out_date - booking.check_in_date).days
    return booking.room.price_per_night * nights
