from app.database import SessionLocal
from app.models.all_models import ServiceRequest
from app.services import staff_service

def test_assignment():
    db = SessionLocal()
    try:
        # Find a request without staff
        req = db.query(ServiceRequest).filter(ServiceRequest.staff_id == None).first()
        if not req:
            print("No unassigned requests found to test.")
            return

        print(f"Testing assignment for Request ID: {req.id}, Type: {req.type}")
        
        # Attempt assignment
        staff = staff_service.assign_staff_to_request(req.id, db)
        
        if staff:
            print(f"SUCCESS: Assigned to {staff.name} (ID: {staff.id})")
            # Refresh request to check property
            db.refresh(req)
            print(f"Property staff_name: {req.staff_name}")
        else:
            print("FAILURE: Could not assign staff.")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_assignment()
