from sqlalchemy.orm import Session
from app.models.all_models import Booking, User, Room, AnomalyLog
from datetime import datetime

class AnomalyResult:
    def __init__(self, is_anomaly: bool, severity: str, score: float, explanation: str):
        self.is_anomaly = is_anomaly
        self.severity = severity
        self.score = score
        self.explanation = explanation

def detect_booking_anomalies(booking: Booking, user: User, room: Room) -> AnomalyResult:
    """
    Analyzes a booking for unusual patterns.
    """
    is_anomaly = False
    severity = "low"
    score = 0.0
    explanations = []

    # 1. Unusual Time (1 AM - 5 AM)
    booking_hour = datetime.now().hour
    if 1 <= booking_hour <= 5:
        is_anomaly = True
        score += 0.3
        explanations.append(f"Booking made at unusual time ({booking_hour}:00 AM).")

    # 2. High Value (> 3x average room price, assuming avg is ~200 for now or use room price)
    # Using a hardcoded threshold for simplicity, or relative to room price
    if booking.amount and booking.amount > (room.price_per_night * 5): # Very long stay or expensive
        is_anomaly = True
        score += 0.4
        severity = "medium"
        explanations.append(f"High value booking (₦{booking.amount:,.2f}).")

    # 3. Short Notice (Same day check-in)
    if booking.check_in_date.date() == datetime.now().date():
        score += 0.2
        explanations.append("Same-day check-in.")

    # 4. New User High Value
    # If user created recently (e.g. today) and high value
    if (datetime.now() - user.created_at.replace(tzinfo=None)).days < 1 and booking.amount > 100000: # 100k Naira
        is_anomaly = True
        score += 0.5
        severity = "high"
        explanations.append("New user making high-value booking immediately.")

    if score > 0.7:
        severity = "high"
    elif score > 0.4:
        severity = "medium"

    if is_anomaly or score > 0.3:
        return AnomalyResult(True, severity, min(score, 1.0), " ".join(explanations))
    
    return AnomalyResult(False, "low", 0.0, "Normal booking pattern.")

def log_anomaly(db: Session, result: AnomalyResult, entity_desc: str):
    if result.is_anomaly:
        log = AnomalyLog(
            description=result.explanation,
            confidence=result.score,
            severity=result.severity,
            related_entity=entity_desc
        )
        db.add(log)
        db.commit()
