from app.routers.auth import register
from app.schemas.all_schemas import UserRegisterEnhanced
from app.database import SessionLocal
import random
import string
import sys
import os

# Add app to path
sys.path.append(os.getcwd())

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def verify_direct():
    print("--- VERIFYING DIRECT FUNCTION CALL ---")
    
    uid = f"TEST-{generate_random_string(6)}"
    email = f"test_{generate_random_string()}@example.com"
    
    user_in = UserRegisterEnhanced(
        name="Direct Test User",
        email=email,
        password="password123",
        phone="+1234567890",
        unique_id=uid,
        selfie_image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )
    
    db = SessionLocal()
    try:
        print(f"Calling register for {email}...")
        response = register(user=user_in, db=db)
        
        print("✅ Function returned successfully")
        print(f"User ID: {response.user_id}")
        print(f"OSINT Summary: {response.osint_summary}")
        print(f"Anomaly Alert: {response.anomaly_alert}")
        
        # We expect osint_summary to be a string eventually if key is valid
        if response.osint_summary:
            print("✅ OSINT field populated.")
        else:
            print("INFO: OSINT field is None.")

    except Exception as e:
        print(f"❌ Exception: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_direct()
