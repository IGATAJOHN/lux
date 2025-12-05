import sys
import io
# Force UTF-8 for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.models.all_models import Booking, ServiceRequest, FraudLog
from app.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("\n--- VALIDATION RESULTS ---")

# 1. Active Guests
active_count = db.query(Booking).filter(Booking.status == "checked_in").count()
print(f"ACTIVE GUESTS: {active_count}")
if active_count > 0:
    print("  (This matches count of bookings with status='checked_in')")

# 2. Open Requests
open_count = db.query(ServiceRequest).filter(ServiceRequest.status == "open").count()
print(f"OPEN REQUESTS: {open_count}")

# Check where they went
in_progress_count = db.query(ServiceRequest).filter(ServiceRequest.status == "in_progress").count()
completed_count = db.query(ServiceRequest).filter(ServiceRequest.status == "completed").count()

if open_count == 0 and (in_progress_count > 0 or completed_count > 0):
    print(f"  Note: You have {in_progress_count} IN_PROGRESS and {completed_count} COMPLETED requests.")
    print("  'Open Requests' only counts unassigned/new requests.")

# 3. Fraud Alerts
fraud_count = db.query(FraudLog).count()
print(f"FRAUD ALERTS: {fraud_count}")

db.close()
