from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import ServiceRequest, Booking, User
from app.schemas.all_schemas import ServiceRequestCreate, ServiceRequestResponse, RecommendationResponse
from app.routers.auth import get_current_user
from app.utils.ai_mock import mock_recommendations

router = APIRouter()

@router.get("/dashboard")
def guest_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_booking = db.query(Booking).filter(Booking.user_id == current_user.id, Booking.status.in_(["confirmed", "checked_in"])).first()
    requests = db.query(ServiceRequest).filter(ServiceRequest.user_id == current_user.id, ServiceRequest.status == "open").all()
    recs = mock_recommendations(current_user.id)
    
    return {
        "current_room": active_booking.room.room_number if active_booking and active_booking.room else None,
        "active_requests": len(requests),
        "booking_status": active_booking.status if active_booking else "No active booking",
        "recommendations": recs
    }

@router.post("/request", response_model=ServiceRequestResponse)
def create_request(request: ServiceRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user has an active booking
    active_booking = db.query(Booking).filter(
        Booking.user_id == current_user.id,
        Booking.status.in_(["confirmed", "checked_in"])
    ).first()

    if not active_booking:
        raise HTTPException(status_code=403, detail="You must have an active booking to request services.")

    new_req = ServiceRequest(
        user_id=current_user.id,
        type=request.type,
        description=request.description
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    # Auto-assign staff
    from app.services import staff_service
    try:
        assigned_staff = staff_service.assign_staff_to_request(new_req.id, db) 
        if not assigned_staff:
            print(f"⚠️ Warning: No staff available for request type '{request.type}'")
    except Exception as e:
        print(f"❌ Error during staff assignment: {str(e)}")
        # Don't fail the request creation, just log the error

    return new_req

@router.get("/requests", response_model=List[ServiceRequestResponse])
def get_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ServiceRequest).filter(ServiceRequest.user_id == current_user.id).all()
