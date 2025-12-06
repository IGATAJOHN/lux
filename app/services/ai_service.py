from app.utils.ai_mock import mock_fraud_score, mock_anomaly_detection, mock_recommendations
from app.core.config import settings
import requests
from typing import Optional

def get_fraud_score():
    return mock_fraud_score({})

def detect_anomaly():
    return mock_anomaly_detection({})

def get_recommendations(guest_id: int):
    return mock_recommendations(guest_id)

def get_id_fraud_score():
    return {
        "score": 15,
        "riskLevel": "LOW",
        "details": "ID valid, Face match confirmed"
    }

def get_churn_prediction(guest_id: int):
    return {
        "churn_probability": 0.15,
        "risk_level": "LOW"
    }

def perform_osint_check(email: str, phone: Optional[str] = None) -> Optional[str]:
    """
    Perform usage check using Tavily API if key is present.
    Returns a one-line summary or None.
    """
    if not settings.TAVILY_API_KEY:
        return None
        
    try:
        # Simple search for email/phone reputation
        query = f"OSINT reputation check for email {email}"
        if phone:
            query += f" or phone {phone}"
            
        response = requests.post(
            "https://api.tavily.com/search",
            json={"api_key": settings.TAVILY_API_KEY, "query": query, "search_depth": "basic", "include_answer": True},
            timeout=5
        )
        data = response.json()
        
        if data.get("answer"):
             return f"OSINT Summary: {data['answer']}"
        elif data.get("results"):
             # Just take first result title as summary
             return f"OSINT Note: Found public references: {data['results'][0]['title']}"
        return "OSINT: No public flags found."
        
    except Exception as e:
        print(f"OSINT Check failed: {e}")
        return None
