from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.notification_service import get_staff_notifications, mark_as_read
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/staff/{staff_id}")
def get_notifications(staff_id: int, unread_only: bool = True, db: Session = Depends(get_db)):
    """
    Get notifications for a specific staff member.
    """
    return get_staff_notifications(db, staff_id, unread_only)

@router.post("/read/{notification_id}")
def read_notification(notification_id: int, db: Session = Depends(get_db)):
    """
    Mark a notification as read.
    """
    notification = mark_as_read(db, notification_id)
    return {"status": "success", "notification_id": notification.id if notification else None}

@router.post("/guest")
def notify_guest(message: str = Body(..., embed=True), guest_id: int = Body(..., embed=True)):
    return {"status": "mock_sent", "recipient": f"guest_{guest_id}", "message": message}

@router.post("/staff")
def notify_staff_manual(message: str = Body(..., embed=True), staff_id: int = Body(..., embed=True)):
    return {"status": "mock_sent", "recipient": f"staff_{staff_id}", "message": message}
