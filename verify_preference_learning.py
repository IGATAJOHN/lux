from app.routers.chat import chat_message, ChatMessage
from app.database import SessionLocal
from app.models.all_models import User
import asyncio
import json

def verify_preferences():
    print("--- VERIFYING PREFERENCE LEARNING ---")
    sid = "verify_pref_v1"
    db = SessionLocal()
    
    # 1. Setup User
    email = "pref_test@example.com"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name="Pref User", unique_id="99999999911", is_verified=True, role="guest", hashed_password="pw")
        db.add(user)
        db.commit()
    else:
        # Clear prefs
        user.preferences = None
        db.commit()

    print(f"User: {user.name} (ID: {user.id})")

    # 2. State user preference
    print("\n[Step 1] User: 'I am allergic to nuts'")
    msg = ChatMessage(message="I am allergic to nuts", session_id=sid)
    resp = asyncio.run(chat_message(msg, current_user=user, db=db))
    print(f"Bot: {resp.response}")
    
    # Check DB
    db.refresh(user)
    print(f"DB Preferences: {user.preferences}")
    if user.preferences and "nuts" in user.preferences.lower():
         print("✅ Preference Saved to DB")
    else:
         print("❌ Preference NOT Saved")

    # 3. Ask for recommendation
    print("\n[Step 2] User: 'Suggest a snack'")
    msg2 = ChatMessage(message="Suggest a snack", session_id=sid)
    resp2 = asyncio.run(chat_message(msg2, current_user=user, db=db))
    print(f"Bot: {resp2.response}")
    
    if "nut" in resp2.response.lower() and "free" in resp2.response.lower() or "avoid" in resp2.response.lower():
         print("✅ Recommendation was personalized (avoided nuts or mentioned allergy)")
    elif "fruit" in resp2.response.lower() or "salad" in resp2.response.lower():
         print("✅ Safe recommendation given.")
    else:
         print("ℹ Check response for relevance.")

    db.close()

if __name__ == "__main__":
    verify_preferences()
