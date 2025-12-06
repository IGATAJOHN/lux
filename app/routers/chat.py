from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import re
import json

from app.database import get_db
from app.services import nin_service
from app.models.all_models import User
from app.utils.security import get_password_hash
from app.services import access_service

router = APIRouter()

# In-memory session store (for MVP only)
# Format: { "session_id": { "step": "step_name", "data": {...} } }
SESSIONS: Dict[str, Dict[str, Any]] = {}

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    action: Optional[str] = None # e.g., "completed"
    data: Optional[Dict[str, Any]] = None

from app.routers.auth import get_current_user_optional

@router.post("/message", response_model=ChatResponse)
async def chat_message(chat: ChatMessage, current_user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    # 1. Manage Session
    session_id = chat.session_id or str(uuid.uuid4())
    if session_id not in SESSIONS:
        SESSIONS[session_id] = {"step": "START", "data": {}}
    
    session = SESSIONS[session_id]
    step = session["step"]
    msg = chat.message.strip()
    
    response_text = ""
    action = None
    response_data = None

    # 2. State Machine vs LLM
    if step == "START":
        # Check if user wants to register (Simple heuristic or LLM intent)
        # For now, let's let LLM handle the initial greeting. If LLM detects "register" intent via tool, we switch mode.
        pass

    # --- REGISTRATION FLOW (Priority if active) ---
    if session.get("mode") == "REGISTRATION":
        # ... [Keep existing Registration Logic Checks here] ...
        if step == "ASK_NIN":
            # [Re-use existing NIN logic]
            nin_data = nin_service.get_nin_details(msg)
            if nin_data:
                session["data"]["nin"] = msg
                session["data"].update(nin_data)
                first_name = nin_data['full_name'].split(' ')[0]
                response_text = f"Welcome back, {first_name}! I retrieved your details.\nPlease enter your **Email Address**."
                session["step"] = "ASK_EMAIL"
            else:
                 response_text = "I couldn't find a record for that NIN. Please check the number and try again."
                 
        elif step == "ASK_EMAIL":
             # [Re-use existing Email logic]
            if "@" not in msg:
                 response_text = "That doesn't look like a valid email. Please try again."
            elif db.query(User).filter(User.email == msg).first():
                 response_text = "This email is already registered. Please use a different one."
            else:
                session["data"]["email"] = msg
                response_text = "Great. Finally, please create a **Password** for your account."
                session["step"] = "ASK_PASSWORD"
                
        elif step == "ASK_PASSWORD":
            # [Re-use existing Password logic and Registration Finish]
            if len(msg) < 4:
                response_text = "Password is too short. Please use at least 4 characters."
            else:
                # REGISTER LOGIC
                try:
                    data = session["data"]
                    hashed_password = get_password_hash(msg)
                    new_user = User(
                        email=data["email"],
                        hashed_password=hashed_password,
                        name=data["full_name"],
                        phone=data.get("phone"),
                        unique_id=data["nin"],
                        selfie_image=data.get("id_photo"),
                        role="guest",
                        access_level="guest",
                        is_verified=True,
                         fraud_score=0.0 # Default safe for NIN users
                    )
                    db.add(new_user)
                    db.flush()
                    
                    pin, pin_hash = access_service.generate_unique_pin(db)
                    new_user.pin_hash = pin_hash
                    
                    from datetime import datetime, timedelta
                    expiration = datetime.utcnow() + timedelta(days=365)
                    qr_code = access_service.generate_qr_code(new_user.id, new_user.unique_id, new_user.name, "guest", expiration)
                    new_user.qr_code_data = qr_code
                    new_user.qr_expiration = expiration
                    
                    db.commit()
                    db.refresh(new_user)
                    
                    response_text = (
                        f"✅ Account successfully created for **{new_user.name}**!\n"
                        f"**Your PIN:** `{pin}`\n"
                        f"A QR code has also been generated for you."
                    )
                    
                    # AI CHECKS
                    try:
                        from app.services import ai_service
                        id_score = ai_service.get_id_fraud_score()
                        if id_score['riskLevel'] in ['MEDIUM', 'HIGH']:
                             response_text += f"\n\n⚠ **Identity Check:** Potential issue ({id_score['details']})."
                        else:
                             response_text += f"\n\n✅ **Identity Check:** Passed ({id_score['riskLevel']})"
                             
                        osint = ai_service.perform_osint_check(new_user.email, new_user.phone)
                        if osint: response_text += f"\n\n🌐 **Public Profile Check:** {osint}"
                        else: response_text += f"\n\n🌐 **Public Profile Check:** Skipped"

                    except Exception: pass
                    
                    action = "completed"
                    response_data = {"pin": pin, "qr_code": qr_code, "user_id": new_user.id}
                    session["step"] = "COMPLETED"
                    session["mode"] = "NORMAL" # Reset to normal LLM mode

                except Exception as e:
                    db.rollback()
                    print(f"Reg Error: {e}")
                    response_text = "Registration error. Please try again."
                    session["step"] = "START"
                    session["mode"] = "NORMAL"

    else:
        # --- NORMAL LLM MODE ---
        from app.services.llm_service import GroqClient, TOOLS, execute_create_service_request, execute_check_booking, execute_update_preferences
        
        # 1. Identify User
        real_user = current_user
        if not real_user and "data" in session and "email" in session["data"]:
             real_user = db.query(User).filter(User.email == session["data"]["email"]).first()
        current_user = real_user

        # 2. Get User Context (Preferences)
        user_context_str = ""
        if current_user and current_user.preferences:
            try:
                prefs = json.loads(current_user.preferences)
                user_context_str = f"KNOWN USER PREFERENCES: {json.dumps(prefs, indent=2)}\n(Use this to personalize answers)"
            except: pass

        # History
        history = session.get("history", [])
        history.append({"role": "user", "content": msg})
        
        # System Prompt
        system_prompt = {
            "role": "system", 
            "content": (
                "You are the Concierge of LuxeStay Hotel. You help guests with bookings, service requests, and registration. "
                "You have access to tools. If user wants to register, call 'trigger_registration'. "
                "If user needs towels/cleaning, call 'create_service_request'. "
                "If the user explicitly states a preference (e.g. 'I like quiet rooms', 'I am vegan', 'I prefer high floors'), call 'update_user_preferences' to save it."
                "Do not ask to save preferences, just save them if stated."
                f"{user_context_str}"
            )
        }
        
        messages = [system_prompt] + history[-5:] # Keep last 5 context
        
        client = GroqClient()
        response = client.chat_completion(messages, tools=TOOLS)
        
        choice = response["choices"][0]["message"]
        
        if "tool_calls" in choice:
            tool_call = choice["tool_calls"][0]
            func_name = tool_call["function"]["name"]
            args = json.loads(tool_call["function"]["arguments"])
            
            if func_name == "trigger_registration":
                response_text = "Certainly! I can help you create an account. Please enter your **NIN** to get started."
                session["mode"] = "REGISTRATION"
                session["step"] = "ASK_NIN"
                
            elif func_name == "create_service_request":
                if not current_user:
                     response_text = "I need to know who you are first. Please register or log in."
                else:
                    result = execute_create_service_request(db, current_user, args["request_type"], args["description"])
                    response_text = f"Done! {result}"
                    
            elif func_name == "check_booking_status":
                if not current_user:
                     response_text = "Please register or tell me your email so I can check."
                else:
                    result = execute_check_booking(db, current_user)
                    response_text = result

            elif func_name == "update_user_preferences":
                if not current_user:
                     response_text = "I've noted that preference." # Anon user
                else:
                    execute_update_preferences(db, current_user, args["preference_key"], args["value"])
                    response_text = f"I've updated your profile: You prefer {args['value']} ({args['preference_key']}). I'll remember that for your stay."
            
        else:
            response_text = choice["content"]

        history.append({"role": "assistant", "content": response_text})
        session["history"] = history
    
    # [Common return logic matching previous structure]

        
    return ChatResponse(
        response=response_text,
        session_id=session_id,
        action=action,
        data=response_data
    )
