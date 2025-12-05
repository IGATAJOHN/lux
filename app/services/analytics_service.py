from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import Booking, User, Room
from datetime import datetime, timedelta

def get_hotel_stats(db: Session):
    # Occupancy Rate
    total_rooms = db.query(Room).count()
    active_bookings = db.query(Booking).filter(
        Booking.status.in_(["checked_in", "confirmed"]),
        Booking.check_in_date <= datetime.now(),
        Booking.check_out_date >= datetime.now()
    ).count()
    
    occupancy_rate = (active_bookings / total_rooms * 100) if total_rooms > 0 else 0

    # Total Revenue (sum of paid bookings)
    total_revenue = db.query(func.sum(Booking.amount)).filter(
        Booking.payment_status == "paid"
    ).scalar() or 0.0

    # Active Guests
    active_guests = db.query(Booking).filter(
        Booking.status == "checked_in"
    ).count()

    return {
        "occupancy_rate": round(occupancy_rate, 1),
        "total_revenue": round(total_revenue, 2),
        "active_guests": active_guests
    }

def get_guest_analytics(db: Session):
    guests = db.query(User).filter(User.role == "guest").all()
    guest_data = []

    for guest in guests:
        # Calculate stats
        total_bookings = len(guest.bookings)
        total_spend = sum(b.amount for b in guest.bookings if b.payment_status == "paid" and b.amount)
        
        last_booking_date = None
        if guest.bookings:
            # Get most recent booking end date
            sorted_bookings = sorted(guest.bookings, key=lambda x: x.check_out_date, reverse=True)
            last_booking_date = sorted_bookings[0].check_out_date

        # Churn Prediction Logic
        churn_risk = "Low"
        churn_score = 0.0
        
        if not last_booking_date:
            churn_risk = "N/A" # New user, no bookings
        else:
            days_since_last_stay = (datetime.now() - last_booking_date).days
            
            # Simple heuristic:
            # > 90 days: High Risk
            # > 60 days: Medium Risk
            # <= 60 days: Low Risk
            
            if days_since_last_stay > 90:
                churn_risk = "High"
                churn_score = 0.8 + (min(days_since_last_stay, 180) / 360) # Cap at some point
            elif days_since_last_stay > 60:
                churn_risk = "Medium"
                churn_score = 0.5
            else:
                churn_risk = "Low"
                churn_score = 0.2

        guest_data.append({
            "id": guest.id,
            "name": guest.name,
            "email": guest.email,
            "total_bookings": total_bookings,
            "total_spend": round(total_spend, 2),
            "last_stay": last_booking_date,
            "churn_risk": churn_risk,
            "churn_score": min(churn_score, 1.0)
        })

    # Sort by churn risk (High first)
    return sorted(guest_data, key=lambda x: x["churn_score"], reverse=True)
