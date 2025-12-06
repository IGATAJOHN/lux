from fastapi import Depends
from app.routers.chat import chat_message, ChatMessage
from app.database import SessionLocal, get_db
import asyncio
import json

# Bypass API wrapping and call function directly
def verify_llm_internal():
    print("--- VERIFYING LLM CHATBOT (INTERNAL) ---")
    sid = "verify_llm_internal_v2"
    db = SessionLocal()
    
    # 1. Test General Chat
    print("\n[Test 1] User: 'I need towels'")
    msg = ChatMessage(message="I need towels", session_id=sid)
    
    try:
        # We need to run async function
        resp = asyncio.run(chat_message(msg, db=db))
        print(f"Bot: {resp.response}")
        
        if "register" in resp.response.lower() or "identity" in resp.response.lower() or "who you are" in resp.response.lower():
             print("✅ Success: LLM asked for identity/registration.")
        else:
             print("ℹ Note: LLM might have hallucinated or used different phrasing.")

    except Exception as e:
        print(f"❌ Error: {e}")

    # 2. Test Registration Trigger
    print("\n[Test 2] User: 'I want to create an account'")
    msg2 = ChatMessage(message="I want to create an account", session_id=sid)
    
    try:
        resp = asyncio.run(chat_message(msg2, db=db))
        print(f"Bot: {resp.response}")
        
        if "NIN" in resp.response:
             print("✅ Success: Registration Flow Triggered")
        else:
             print("❌ Failed: Registration Flow NOT Triggered")
             
    except Exception as e:
        print(f"❌ Error: {e}")
        
    db.close()

if __name__ == "__main__":
    verify_llm_internal()
