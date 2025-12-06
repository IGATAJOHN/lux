import requests
import json
from app.core.config import settings
from typing import Dict, Any, List, Optional
from app.models.all_models import ServiceRequest, Booking, User
from sqlalchemy.orm import Session
from app.services import staff_service, nin_service

class GroqClient:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile" # Latest capable model

    def chat_completion(self, messages: List[Dict[str, str]], tools: Optional[List[Dict]] = None) -> Dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3 # Lower temp for more deterministic tool usage
        }
        
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
            
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
            if not response.ok:
                print(f"Groq API Error Details: {response.text}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Groq API Error: {e}")
            return {"choices": [{"message": {"content": "I apologize, but I'm having trouble connecting to my brain right now. Please try again later."}}]}

# --- Tool Definitions ---

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_service_request",
            "description": "Create a service request for a guest (e.g., requesting towels, housekeeping, maintenance).",
            "parameters": {
                "type": "object",
                "properties": {
                    "request_type": {
                        "type": "string",
                        "enum": ["cleaning", "maintenance", "room_service", "other"],
                        "description": "The category of the request."
                    },
                    "description": {
                        "type": "string",
                        "description": "Specific details of what the guest needs."
                    }
                },
                "required": ["request_type", "description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_booking_status",
            "description": "Check the current booking status and room number for the user.",
            "parameters": {
                "type": "object",
                "properties": {} # No args needed, uses current session user
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "trigger_registration",
            "description": "Start the user registration process if the user asks to sign up or register.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_user_preferences",
            "description": "Save a user's preference found in the conversation (e.g., 'likes high floor', 'vegan', 'late sleeper').",
            "parameters": {
                "type": "object",
                "properties": {
                    "preference_key": {
                        "type": "string",
                        "description": "Category of preference (e.g., 'room', 'food', 'amenity', 'general')."
                    },
                    "value": {
                        "type": "string",
                        "description": "The specific preference detail (e.g., 'high floor', 'vegan', 'extra pillows')."
                    }
                },
                "required": ["preference_key", "value"]
            }
        }
    }
]

# --- Tool Executors ---

def execute_create_service_request(db: Session, user: User, request_type: str, description: str) -> str:
    # 1. Check for active booking
    active_booking = db.query(Booking).filter(
        Booking.user_id == user.id,
        Booking.status.in_(["confirmed", "checked_in"])
    ).first()
    
    if not active_booking:
        return "You must have an active booking and be checked in to create a service request."

    # 2. Create Request
    new_req = ServiceRequest(
        user_id=user.id,
        type=request_type,
        description=description,
        status="open"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    # 3. Auto-assign
    try:
        from app.services import staff_service
        assigned = staff_service.assign_staff_to_request(new_req.id, db)
        assign_msg = f" Assigned to {assigned.name}." if assigned else " Queued for assignment."
    except Exception:
        assign_msg = " Queued for assignment."
        
    return f"Service Request #{new_req.id} for '{description}' created.{assign_msg}"

def execute_check_booking(db: Session, user: User) -> str:
    booking = db.query(Booking).filter(
        Booking.user_id == user.id,
        Booking.status.in_(["confirmed", "checked_in"])
    ).first()
    
    if not booking:
        return "You do not have any active confirmed bookings at the moment."
    
    room_info = f"Room {booking.room.room_number}" if booking.room else "Room not yet assigned"
    return f"You have an active booking (Status: {booking.status}). {room_info}. Check-out is on {booking.check_out_date.date()}."

def execute_update_preferences(db: Session, user: User, key: str, value: str) -> str:
    try:
        import json
        prefs = {}
        if user.preferences:
            try:
                prefs = json.loads(user.preferences)
            except:
                prefs = {}
        
        # Update or Add
        # If key exists, maybe append or overwrite? Let's overwrite / merge for simplicity or make it a list if needed.
        # Simple Key-Value for now.
        prefs[key] = value
        
        user.preferences = json.dumps(prefs)
        db.commit()
        db.refresh(user)
        return f"access_memory: updated {key}={value}"
    except Exception as e:
        print(f"Pref Error: {e}")
        return "Failed to update preference."
