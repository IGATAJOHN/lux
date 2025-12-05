from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import ServiceRequest, Staff
from datetime import datetime

def assign_staff_to_request(request_id: int, db: Session):
    """
    Automatically assigns a staff member to a service request based on department and workload.
    """
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not request:
        return None

    # 1. Determine Department
    department_map = {
        "room_service": "kitchen",
        "cleaning": "housekeeping",
        "maintenance": "maintenance",
        "other": "concierge"
    }
    target_department = department_map.get(request.type, "concierge")

    # 2. Find Available Staff in Department
    # We look for active staff in the department
    # We want to balance load, so we join with requests to count active tasks
    
    # Subquery to count active requests per staff
    active_requests_subquery = (
        db.query(
            ServiceRequest.staff_id,
            func.count(ServiceRequest.id).label("active_count")
        )
        .filter(ServiceRequest.status == "in_progress")
        .group_by(ServiceRequest.staff_id)
        .subquery()
    )

    # Query staff with their active task count
    candidate = (
        db.query(Staff)
        .outerjoin(active_requests_subquery, Staff.id == active_requests_subquery.c.staff_id)
        .filter(
            Staff.department == target_department,
            Staff.status == "active"
        )
        .order_by(func.coalesce(active_requests_subquery.c.active_count, 0).asc()) # Least busy first
        .first()
    )

    if candidate:
        # Assign staff
        request.staff_id = candidate.id
        request.status = "in_progress"
        request.assigned_at = datetime.now()
        
        # Update staff current task (optional, just for quick view)
        candidate.current_task_id = request.id
        
        db.commit()
        db.refresh(request)
        print(f"✅ Assigned {candidate.name} to request #{request.id}")
        return candidate
    else:
        print(f"⚠️ No staff found for department '{target_department}' (request type: '{request.type}')")
    
    return None
