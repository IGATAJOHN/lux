from app.database import SessionLocal
from app.models.all_models import Room, Booking, User
from app.services import room_service, payment_service
from app.routers.rooms import get_rooms
from app.routers.bookings import initialize_payment
from datetime import datetime, timedelta

def test_booking_issues():
    db = SessionLocal()
    try:
        print("--- Testing Room Availability Filtering ---")
        # 1. Setup: Ensure we have at least one occupied room and one available room
        # Check existing rooms
        available_room = db.query(Room).filter(Room.status == "available").first()
        if not available_room:
            available_room = Room(room_number="901", room_type="test_single", price_per_night=100, status="available")
            db.add(available_room)
            db.commit()
            print("Created available room 901")

        occupied_room = db.query(Room).filter(Room.status == "occupied").first()
        if not occupied_room:
            occupied_room = Room(room_number="902", room_type="test_occupied", price_per_night=100, status="occupied")
            db.add(occupied_room)
            db.commit()
            print("Created occupied room 902")
        
        # 2. Call service directly to check filtering
        rooms = room_service.get_rooms(db, status="available")
        print(f"Total available rooms returned: {len(rooms)}")
        
        has_occupied = any(r.status == "occupied" for r in rooms)
        if has_occupied:
            print("FAIL: get_rooms(status='available') returned occupied rooms!")
            for r in rooms:
                if r.status == "occupied":
                    print(f" - Found occupied room: {r.room_number}")
        else:
            print("PASS: get_rooms(status='available') returned only available rooms.")
            
        print("\n--- Testing Payment Amount ---")
        # 3. Create a booking for a specific room type with a KNOWN DB price
        # Let's use a unique price to be sure
        test_price = 123.45
        test_type = "special_suite"
        
        # Ensure a room exists with this price matching the type logic
        # Note: current payment service looks for room_type in hardcoded dict.
        # We want to see if it picks up DB price or hardcoded.
        
        # Create a room with this type
        special_room = db.query(Room).filter(Room.room_type == test_type).first()
        if not special_room:
            special_room = Room(room_number="999", room_type=test_type, price_per_night=test_price, status="available")
            db.add(special_room)
            db.commit()
        else:
            # Update price to ensure it's our test price
            special_room.price_per_night = test_price
            db.commit()
            
        # Create a booking
        guest = db.query(User).first() # Grab any user
        if not guest:
            print("No users found, skipping payment test")
            return

        booking = Booking(
            user_id=guest.id,
            room_type=test_type, # Using the type
            check_in_date=datetime.now(),
            check_out_date=datetime.now() + timedelta(days=1),
            status="pending"
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        
        print(f"Created booking {booking.id} for 1 night. Expected amount: {test_price}")
        
        # Initialize payment
        # We catch exception because we might not have PAYSTACK_SECRET_KEY in env, leading to 401 from Paystack
        # But we can check if it calculated the price correctly BEFORE calling paystack (by checking booking.amount)
        # OR we can inspect the exception if it fails at request
        try:
            # We unfortunately can't inspect booking.amount directly from initialize_paystack_payment return unless it succeeds
            # But the service updates the booking object!
            try:
                payment_service.initialize_paystack_payment(booking, db)
            except Exception as e:
                print(f"Payment init failed (expected if no key): {e}")
            
            # Refresh booking from DB to see if amount was set
            db.refresh(booking)
            print(f"Booking amount set to: {booking.amount}")
            
            if abs((booking.amount or 0) - test_price) < 0.01:
                 print("PASS: Booking amount matches DB room price.")
            else:
                 print(f"FAIL: Booking amount {booking.amount} does NOT match DB price {test_price}.")
                 
        except Exception as e:
            print(f"Error during payment test: {e}")

    except Exception as e:
        print(f"Global Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_booking_issues()
