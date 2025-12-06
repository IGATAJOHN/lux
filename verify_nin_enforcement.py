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

def verify_nin_enforcement():
    print("--- VERIFYING NIN ENFORCEMENT ---")
    
    db = SessionLocal()
    
    # Test Case 1: Invalid ID (Alphanumeric)
    print("\n[Test 1] Registering with Alphanumeric ID (Should Fail)")
    try:
        register(user=UserRegisterEnhanced(
            name="Invalid User",
            email=f"fail_{generate_random_string()}@example.com",
            password="password",
            phone="123",
            unique_id="MY-ID-123", # Invalid
            selfie_image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        ), db=db)
        print("❌ Failed: Function succeeded but should have raised HTTPException")
    except Exception as e:
        if "Invalid Unique ID format" in str(e):
             print("✅ Success: Rejected alphanumeric ID")
        else:
             print(f"❌ Failed: Raised wrong exception: {e}")

    # Test Case 2: Valid NIN (11 digits)
    # We need a unique one or ensure db cleanup. Random 11 digits.
    valid_nin = ''.join(random.choices(string.digits, k=11))
    print(f"\n[Test 2] Registering with Valid NIN: {valid_nin} (Should Succeed)")
    
    try:
        response = register(user=UserRegisterEnhanced(
            name="Valid NIN User",
            email=f"pass_{generate_random_string()}@example.com",
            password="password",
            phone="123",
            unique_id=valid_nin,
            selfie_image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        ), db=db)
        print("✅ Success: Registered with 11-digit NIN")
        print(f"User ID: {response.user_id}")
        
    except Exception as e:
        print(f"❌ Failed: Valid NIN was rejected: {e}")
        
    db.close()

if __name__ == "__main__":
    verify_nin_enforcement()
