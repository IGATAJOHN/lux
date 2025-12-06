from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.all_models import User, Room, Booking
from app.services.booking_service import create_booking
from app.schemas.all_schemas import BookingCreate
from datetime import date, timedelta

# Setup DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./hotel_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def diagnose():
    print("--- DIAGNOSIS START ---")
    
    # 1. Find User Adeola
    user = db.query(User).filter(User.name.ilike("%Adeola%")).first()
    if not user:
        print("CRITICAL: User 'Adeola' not found in database.")
    else:
        print(f"User Found: {user.name} (ID: {user.id}, Role: {user.role})")
        
        # 2. Check Rooms
        print("\n--- ROOM STATUS ---")
        rooms = db.query(Room).all()
        available_count = {}
        for r in rooms:
            print(f"Room {r.room_number}: Type={r.room_type}, Status={r.status}, Price={r.price_per_night}")
            if r.status == 'available':
                available_count[r.room_type] = available_count.get(r.room_type, 0) + 1
        
        print(f"\nAvailable rooms summary: {available_count}")

        # 3. Simulate Booking
        if available_count:
            target_type = list(available_count.keys())[0]
            print(f"\n--- SIMULATING BOOKING for {target_type} ---")
            
            booking_data = BookingCreate(
                check_in_date=date.today() + timedelta(days=1),
                check_out_date=date.today() + timedelta(days=3),
                room_type=target_type,
                preferences="Quiet room"
            )
            
            # We call the service function directly
            # Note: This might create a real booking if successful, which is fine for diagnosis (we can rollback or ignore)
            try:
                # Mock fraud score is called inside create_booking
                new_booking, error = create_booking(db, booking_data, user.id)
                if error:
                    print(f"Booking FAILED with error: {error}")
                else:
                    print(f"Booking SUCCESS: ID={new_booking.id}, Amount={new_booking.amount}")
            except Exception as e:
                print(f"Booking EXCEPTION: {e}")
        else:
            print("Skipping simulation: No available rooms.")

if __name__ == "__main__":
    diagnose()
