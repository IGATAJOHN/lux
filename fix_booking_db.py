from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.all_models import Room

# Setup DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./hotel_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def fix_db():
    print("--- FIXING DATABASE ---")
    
    # 1. Add 'preferences' column to 'bookings' table
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN preferences TEXT"))
            conn.commit()
        print("SUCCESS: Added 'preferences' column to bookings table.")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print("INFO: 'preferences' column already exists.")
        else:
            print(f"WARNING: Could not alter table (might already exist): {e}")

    # 2. Free up some rooms
    print("\n--- FREEING UP ROOMS ---")
    rooms_to_free = ["100", "101", "102"] # Single, Double, Suite
    
    try:
        count = db.query(Room).filter(Room.room_number.in_(rooms_to_free)).update({Room.status: "available"}, synchronize_session=False)
        db.commit()
        print(f"SUCCESS: Set {count} rooms to 'available'.")
    except Exception as e:
        print(f"ERROR: Could not update rooms: {e}")

if __name__ == "__main__":
    fix_db()
