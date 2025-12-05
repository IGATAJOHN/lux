from app.database import SessionLocal
from app.models.all_models import ServiceRequest, User, Booking, Room
from app.routers.guest import create_request
from app.schemas.all_schemas import ServiceRequestCreate
from datetime import datetime, timedelta

def test_full_flow():
    db = SessionLocal()
    try:
        # 1. Get or Create a Guest User
        guest = db.query(User).filter(User.email == "test_guest@example.com").first()
        if not guest:
            guest = User(
                name="Test Guest",
                email="test_guest@example.com",
                hashed_password="hashed_secret",
                role="guest",
                unique_id="GUEST123"
            )
            db.add(guest)
            db.commit()
            db.refresh(guest)
        
        # 2. Ensure Guest has an active checked-in booking
        booking = db.query(Booking).filter(Booking.user_id == guest.id, Booking.status == "checked_in").first()
        if not booking:
            # Need a room first
            room = db.query(Room).first()
            if not room:
                room = Room(room_number="101", room_type="single", price_per_night=100, status="occupied")
                db.add(room)
                db.commit()
            
            booking = Booking(
                user_id=guest.id,
                room_id=room.id,
                check_in_date=datetime.now() - timedelta(days=1),
                check_out_date=datetime.now() + timedelta(days=1),
                status="checked_in"
            )
            db.add(booking)
            db.commit()
            print("Created active booking for test guest.")

        # 3. Create a Service Request via the function (simulating API call)
        # We need to mock the dependency injection or just call the logic directly if possible.
        # Since create_request uses Depends, we can't call it easily without a context.
        # Instead, let's replicate the logic exactly as it is in the router.
        
        print("Creating service request...")
        new_req = ServiceRequest(
            user_id=guest.id,
            type="cleaning",
            description="Test cleaning request"
        )
        db.add(new_req)
        db.commit()
        db.refresh(new_req)
        
        # Trigger assignment manually as the router does
        from app.services import staff_service
        assigned_staff = staff_service.assign_staff_to_request(new_req.id, db)
        
        if assigned_staff:
            print(f"SUCCESS: Request created and assigned to {assigned_staff.name}")
        else:
            print("FAILURE: Request created but NOT assigned.")
            
        # 4. Verify it exists in DB with staff_id
        db.refresh(new_req)
        print(f"DB Verification - Request ID: {new_req.id}, Staff ID: {new_req.staff_id}, Staff Name: {new_req.staff_name}")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_full_flow()
