from app.database import SessionLocal
from app.models.all_models import Staff

def seed_staff():
    db = SessionLocal()
    try:
        departments = ["kitchen", "housekeeping", "maintenance", "concierge"]
        
        for dept in departments:
            exists = db.query(Staff).filter(Staff.department == dept).first()
            if not exists:
                print(f"Creating staff for {dept}...")
                new_staff = Staff(
                    name=f"{dept.capitalize()} Staff",
                    email=f"{dept}@hotel.com",
                    role="staff",
                    department=dept,
                    status="active"
                )
                db.add(new_staff)
            else:
                print(f"Staff for {dept} already exists.")
        
        db.commit()
        print("Staff seeding completed.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_staff()
