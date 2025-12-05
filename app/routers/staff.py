from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import Staff, ServiceRequest
from app.routers.auth import get_current_user

router = APIRouter()

from app.schemas.all_schemas import StaffResponse, StaffCreate

@router.get("/", response_model=List[StaffResponse])
def get_staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()

@router.post("/", response_model=StaffResponse)
def create_staff(staff: StaffCreate, db: Session = Depends(get_db)):
    # Check if email exists
    if staff.email:
        existing_staff = db.query(Staff).filter(Staff.email == staff.email).first()
        if existing_staff:
            raise HTTPException(status_code=400, detail="Email already registered")
            
    new_staff = Staff(**staff.dict())
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
        
    staff.current_task_id = request.id
    request.status = "in_progress"
    db.commit()
    
    return {"message": f"Staff {staff.name} assigned to request {request.id}"}
