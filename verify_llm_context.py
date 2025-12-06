from app.routers.chat import chat_message, ChatMessage
from app.database import SessionLocal
from app.models.all_models import User
import asyncio
import sys
import os

# Bypass API wrapping and call function directly
def verify_llm_context():
    print("--- VERIFYING LLM CONTEXT AWARENESS ---")
    sid = "verify_ctx_v1"
    db = SessionLocal()
    
    # 1. Test Anonymous (current_user=None)
    print("\n[Test 1] Anonymous User: 'I need towels'")
    msg = ChatMessage(message="I need towels", session_id=sid)
    
    try:
        # Pass current_user=None explicitly
        resp = asyncio.run(chat_message(chat=msg, current_user=None, db=db))
        print(f"Bot: {resp.response}")
        
        if "register" in resp.response.lower() or "log in" in resp.response.lower():
             print("✅ Success: Bot asked anonymous user to login.")
        else:
             print("❌ Failed: Bot did NOT ask for login.")

    except Exception as e:
        print(f"❌ Error: {e}")

    # 2. Test Logged In (current_user=User(...))
    print("\n[Test 2] Logged-In User: 'I need towels'")
    
    # Get or create a test user
    user = db.query(User).filter(User.email == "test_ctx@example.com").first()
    if not user:
        user = User(email="test_ctx@example.com", name="Ctx Test", unique_id="00000000000", is_verified=True, role="guest", hashed_password="pw")
        db.add(user)
        db.commit()
    
    # Mock active booking for service request to work
    from app.models.all_models import Booking, Room
    from datetime import datetime
    booking = db.query(Booking).filter(Booking.user_id == user.id).first()
    if not booking:
        booking = Booking(user_id=user.id, check_in_date=datetime.now(), check_out_date=datetime.now(), status="checked_in", fraud_score=0)
        db.add(booking)
        db.commit()
        
    try:
        resp = asyncio.run(chat_message(chat=msg, current_user=user, db=db))
        print(f"Bot: {resp.response}")
        
        if "Service Request" in resp.response or "created" in resp.response or "Done" in resp.response:
             print("✅ Success: Bot created request for logged-in user.")
        else:
             print(f"❌ Failed: Bot refused or failed. Response: {resp.response}")
             
    except Exception as e:
        print(f"❌ Error: {e}")
        
    db.close()

if __name__ == "__main__":
    verify_llm_context()
