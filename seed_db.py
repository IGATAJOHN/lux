from app.database import SessionLocal, engine, Base
from app.models.all_models import User
from app.utils.security import get_password_hash

def seed():
    # Drop all existing tables
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables fresh
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create admin user
        print("Creating admin user...")
        admin_user = User(
            name="Admin User",
            email="admin@hotel.com",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            access_level="admin",
            phone="1234567890",
            unique_id="ADMIN001"
        )
        db.add(admin_user)
        db.commit()
        print("✓ Database cleared and recreated!")
        print("✓ Admin user: admin@hotel.com / admin123")
        print("✓ All previous users deleted - ready for re-registration!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
