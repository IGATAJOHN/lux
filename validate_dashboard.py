from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.all_models import Booking, ServiceRequest, FraudLog, User
from app.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("--- DIAGNOSTIC REPORT ---")

# 1. Active Guests (Checked In)
active_bookings = db.query(Booking).filter(Booking.status == "checked_in").all()
print(f"\n[Active Guests] Count via Query: {len(active_bookings)}")
if active_bookings:
    for b in active_bookings:
        guest = db.query(User).filter(User.id == b.user_id).first()
        print(f"  - Booking #{b.id}: User '{guest.name if guest else 'Unknown'}' (Room {b.room_id})")
else:
    print("  (None found)")

# 2. Service Requests
open_reqs = db.query(ServiceRequest).filter(ServiceRequest.status == "open").all()
in_progress_reqs = db.query(ServiceRequest).filter(ServiceRequest.status == "in_progress").all()
print(f"\n[Service Requests]")
print(f"  - Open (Unassigned): {len(open_reqs)}")
for r in open_reqs:
    print(f"    * #{r.id}: {r.type} - '{r.description}'")

print(f"  - In Progress (Assigned): {len(in_progress_reqs)}")
for r in in_progress_reqs:
    print(f"    * #{r.id}: {r.type} - Assigned to Staff ID {r.staff_id}")

# 3. Fraud Alerts
fraud_count = db.query(FraudLog).count()
print(f"\n[Fraud Alerts] Count: {fraud_count}")

db.close()
