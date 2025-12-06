from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.all_models import User

# Setup DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./hotel_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def check_fatima():
    print("--- CHECKING USER: Fatima Bello ---")
    
    # Search loosely
    user = db.query(User).filter(User.name.ilike("%Fatima%")).first()
    
    if user:
        print(f"✅ User Found: {user.name} (ID: {user.id})")
        print(f"   Email: {user.email}")
        print(f"   Phone: {user.phone}")
        print(f"   Role: {user.role}")
        print(f"   Verified: {user.is_verified}")
        print(f"   Fraud Score: {user.fraud_score}")
        print(f"   PIN Hash Exists: {bool(user.pin_hash)}")
        print(f"   QR Code Data Exists: {bool(user.qr_code_data)}")
        
        if user.qr_code_data:
            print("   QR Code Data Length:", len(user.qr_code_data))
    else:
        print("❌ User 'Fatima' not found in database.")

if __name__ == "__main__":
    check_fatima()
