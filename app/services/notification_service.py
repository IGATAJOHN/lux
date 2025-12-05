from sqlalchemy.orm import Session
from app.models.all_models import Notification
from typing import List, Optional

def create_notification(db: Session, message: str, staff_id: Optional[int] = None, user_id: Optional[int] = None) -> Notification:
    """
    Creates a new notification for a staff member or a user.
    """
    new_notification = Notification(
        message=message,
        recipient_staff_id=staff_id,
        recipient_user_id=user_id,
        is_read=False
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    return new_notification

def get_staff_notifications(db: Session, staff_id: int, unread_only: bool = True) -> List[Notification]:
    """
    Retrieves notifications for a specific staff member.
    """
    query = db.query(Notification).filter(Notification.recipient_staff_id == staff_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).all()

def mark_as_read(db: Session, notification_id: int) -> Optional[Notification]:
    """
    Marks a notification as read.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification
