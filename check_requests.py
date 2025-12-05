from app.database import SessionLocal
from app.models.all_models import ServiceRequest, Staff

def check_requests():
    db = SessionLocal()
    try:
        requests = db.query(ServiceRequest).all()
        print(f"Found {len(requests)} requests.")
        for req in requests:
            staff_name = req.staff.name if req.staff else "None"
            print(f"ID: {req.id}, Type: {req.type}, Status: {req.status}, Staff ID: {req.staff_id}, Staff Name: {staff_name}")
    finally:
        db.close()

if __name__ == "__main__":
    check_requests()
