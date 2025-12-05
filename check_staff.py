from app.database import SessionLocal
from app.models.all_models import Staff

def check_staff():
    db = SessionLocal()
    try:
        staff_members = db.query(Staff).all()
        print(f"Found {len(staff_members)} staff members.")
        for s in staff_members:
            print(f"ID: {s.id}, Name: {s.name}, Dept: {s.department}, Status: {s.status}")
    finally:
        db.close()

if __name__ == "__main__":
    check_staff()
