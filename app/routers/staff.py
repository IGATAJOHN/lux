from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.all_models import Staff, ServiceRequest, User
from app.routers.auth import get_current_user
from app.schemas.all_schemas import StaffResponse, StaffCreate
from app.utils.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[StaffResponse])
def get_staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()

@router.post("/", response_model=StaffResponse)
def create_staff(staff: StaffCreate, db: Session = Depends(get_db)):
    # Check if email exists in Staff
    if staff.email:
        existing_staff = db.query(Staff).filter(Staff.email == staff.email).first()
        if existing_staff:
            raise HTTPException(status_code=400, detail="Staff email already registered")

    # Link to existing User or Create New User
    user_id = None
    if staff.email:
        existing_user = db.query(User).filter(User.email == staff.email).first()
        if existing_user:
            # Link to existing user
            user_id = existing_user.id
            # Optionally update role? existing_user.role = "staff"
        elif staff.password:
            # Create new user for staff
            hashed_password = get_password_hash(staff.password)
            new_user = User(
                name=staff.name,
                email=staff.email,
                hashed_password=hashed_password,
                phone=staff.phone,
                unique_id=str(uuid.uuid4())[:8], # Simple unique ID for internal staff
                role="staff",
                access_level="staff"
            )
            db.add(new_user)
            db.flush() # Get ID
            user_id = new_user.id
            
    # Create Staff record
    staff_data = staff.dict(exclude={"password"})
    new_staff = Staff(**staff_data)
    if user_id:
        new_staff.user_id = user_id
        
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@router.post("/assign")
def assign_staff(staff_id: int, request_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    request.status = "in_progress"
    db.commit()
    
    return {"message": f"Staff {staff.name} assigned to request {request.id}"}

@router.get("/me/dashboard")
def get_staff_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get dashboard data for the currently logged-in staff member.
    """
    # Find staff record linked to this user
    staff_member = db.query(Staff).filter(Staff.user_id == current_user.id).first()
    
    if not staff_member:
        # Fallback: try to match by email if link is missing
        staff_member = db.query(Staff).filter(Staff.email == current_user.email).first()
        
    if not staff_member:
        raise HTTPException(status_code=404, detail="No staff profile found for this user")
        
    # Get assigned tasks
    assigned_tasks = db.query(ServiceRequest).filter(
        ServiceRequest.staff_id == staff_member.id,
        ServiceRequest.status.in_(["open", "in_progress"])
    ).all()
    
    # Get unread notifications
    from app.services.notification_service import get_staff_notifications
    notifications = get_staff_notifications(db, staff_member.id, unread_only=True)
    
    return {
        "staff_id": staff_member.id,
        "name": staff_member.name,
        "department": staff_member.department,
        "active_tasks": assigned_tasks,
        "notifications": notifications
    }
