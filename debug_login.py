from app.database import SessionLocal
from app.models.all_models import User
from app.utils.security import verify_password, get_password_hash

def debug_login():
    db = SessionLocal()
    email = "staff.login@example.com"
    password = "password123"
    
    print(f"--- Debugging Login for {email} ---")
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        print("❌ User not found in database!")
    else:
        print(f"✅ User found: ID={user.id}, Role={user.role}")
        print(f"Stored Hash: {user.hashed_password[:10]}...")
        
        # Test verification
        is_valid = verify_password(password, user.hashed_password)
        if is_valid:
            print("✅ Password 'password123' matches stored hash.")
        else:
            print("❌ Password verification FAILED.")
            # Debug hash mismatch
            re_hash = get_password_hash(password)
            print(f"   Re-hashing 'password123' -> {re_hash[:10]}...")
            print("   Note: Bcrypt salts vary, so hashes won't match strings, but verify_password should work.")
            
    db.close()

if __name__ == "__main__":
    debug_login()
