import requests
from unittest.mock import MagicMock
import sys
import os

# Add app to path
sys.path.append(os.getcwd())

from app.services import ai_service
from app.core.config import settings

def verify_checks():
    print("--- VERIFYING AI CHECKS ---")
    
    # 1. ID Fraud
    print("\n[Check 1] ID Fraud Score:")
    id_score = ai_service.get_id_fraud_score()
    print(f"Result: {id_score}")
    if "riskLevel" in id_score:
        print("✅ ID Fraud format correct")
    else:
        print("❌ ID Fraud format missing keys")

    # 2. Anomaly
    print("\n[Check 2] Anomaly Detection:")
    anomaly = ai_service.detect_anomaly()
    print(f"Result: {anomaly}")
    if "anomaly" in anomaly:
        print("✅ Anomaly format correct")
    else:
        print("❌ Anomaly format missing keys")

    # 3. OSINT (Mocked if no key)
    print("\n[Check 3] OSINT:")
    original_key = settings.TAVILY_API_KEY
    
    # Case A: No Key
    settings.TAVILY_API_KEY = None
    res = ai_service.perform_osint_check("test@example.com")
    print(f"No Key Result: {res}")
    if res is None:
        print("✅ Correctly skipped without key")
    else:
        print("❌ Should be None without key")
        
    # Case B: With Dummy Key (Simulated Request)
    settings.TAVILY_API_KEY = "test-key"
    
    # Mock requests.post to avoid real API call failure
    original_post = requests.post
    mock_response = MagicMock()
    mock_response.json.return_value = {"answer": "This email belongs to a verifiable business entity."}
    requests.post = MagicMock(return_value=mock_response)
    
    res = ai_service.perform_osint_check("test@example.com")
    print(f"With Key Result: {res}")
    
    if "OSINT Summary" in res:
        print("✅ OSINT logic executed correctly")
    else:
        print("❌ OSINT logic failed")
        
    # Cleanup
    settings.TAVILY_API_KEY = original_key
    requests.post = original_post

if __name__ == "__main__":
    verify_checks()
