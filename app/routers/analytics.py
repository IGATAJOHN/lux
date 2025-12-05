from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import analytics_service
from app.routers.auth import get_current_user
from app.models.all_models import User

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # In a real app, check for admin role here
    return analytics_service.get_hotel_stats(db)

@router.get("/guests")
def get_guest_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # In a real app, check for admin role here
    return analytics_service.get_guest_analytics(db)
