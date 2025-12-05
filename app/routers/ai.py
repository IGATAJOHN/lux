from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.all_schemas import FraudScoreResponse, AnomalyResponse, RecommendationResponse
from app.utils.ai_mock import mock_fraud_score, mock_anomaly_detection, mock_recommendations
from app.services import ai_service, anomaly_service
from app.database import get_db
from app.models.all_models import Booking, User, Room, AnomalyLog

router = APIRouter()

@router.post("/fraud-score", response_model=FraudScoreResponse)
def get_fraud_score():
    return ai_service.get_fraud_score()

@router.post("/detect-anomaly", response_model=AnomalyResponse)
def detect_anomaly():
    return ai_service.detect_anomaly()

@router.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations(guestId: int):
    return {"recommendations": ai_service.get_recommendations(guestId)}

@router.post("/id-fraud-score")
def id_fraud_score():
    return ai_service.get_id_fraud_score()

@router.get("/churn")
def get_churn_prediction(guestId: int):
    return ai_service.get_churn_prediction(guestId)

@router.post("/analyze/booking/{booking_id}")
def analyze_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    user = db.query(User).filter(User.id == booking.user_id).first()
    room = db.query(Room).filter(Room.id == booking.room_id).first()
    
    if not user or not room:
         raise HTTPException(status_code=404, detail="User or Room not found")

    result = anomaly_service.detect_booking_anomalies(booking, user, room)
    anomaly_service.log_anomaly(db, result, f"Booking #{booking.id}")
    
    return {
        "is_anomaly": result.is_anomaly,
        "severity": result.severity,
        "score": result.score,
        "explanation": result.explanation
    }

@router.get("/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    """Get all anomaly logs for admin dashboard"""
    # TODO: Re-enable once AnomalyLog table is properly set up
    # For now, return empty list to prevent 500 errors
    return []
    
    # Original code (commented out for now):
    # try:
    #     logs = db.query(AnomalyLog).order_by(AnomalyLog.timestamp.desc()).limit(50).all()
    #     return logs
    # except Exception as e:
    #     print(f"Error fetching anomalies: {str(e)}")
    #     return []
