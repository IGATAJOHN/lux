from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import User, Booking, ServiceRequest, FraudLog
from app.routers.auth import get_current_user
from app.schemas.all_schemas import ServiceRequestResponse
from typing import List

router = APIRouter()

@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db)):
    # Simple counts
    active_guests = db.query(Booking).filter(Booking.status == "checked_in").count()
    open_requests = db.query(ServiceRequest).filter(ServiceRequest.status == "open").count()
    fraud_alerts = db.query(FraudLog).count() # Mock count
    
    return {
        "active_guests": active_guests,
        "open_requests": open_requests,
        "fraud_alerts": fraud_alerts,
        "staff_workload": "Moderate" # Mock
    }

@router.get("/bookings")
def get_all_bookings(db: Session = Depends(get_db)):
    return db.query(Booking).all()

@router.get("/guests")
def get_all_guests(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "guest").all()

@router.get("/requests", response_model=List[ServiceRequestResponse])
def get_all_requests(db: Session = Depends(get_db)):
    requests = db.query(ServiceRequest).all()
    return [ServiceRequestResponse.model_validate(req) for req in requests]

@router.put("/request/{request_id}")
def update_request(request_id: int, update: dict, db: Session = Depends(get_db)):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update status if provided
    if "status" in update:
        req.status = update["status"]
    
    db.commit()
    db.refresh(req)
    return {"message": "Request updated"}

@router.post("/update-request-status")
def update_request_status(request_id: int, status: str, db: Session = Depends(get_db)):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        return {"error": "Request not found"}
    req.status = status
    db.commit()
    return {"message": "Status updated"}
