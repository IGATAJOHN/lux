import requests
import sys
import os

# Add app to path
sys.path.append(os.getcwd())

from app.services import ai_service
from app.core.config import settings

def verify_live_osint():
    print("--- VERIFYING LIVE OSINT CHECK ---")
    
    if not settings.TAVILY_API_KEY:
        print("❌ Error: TAVILY_API_KEY is missing in config.")
        return

    print(f"Using Key: {settings.TAVILY_API_KEY[:4]}...{settings.TAVILY_API_KEY[-4:]}")
    
    # Real call to Tavily (or via our service)
    # We use a known public email so we might find something (or nothing, but at least connection works)
    test_email = "support@tavily.com" 
    
    print(f"\nPerforming OSINT check for: {test_email}")
    try:
        # Note: ai_service probably catches exceptions, so we check return value
        result = ai_service.perform_osint_check(test_email)
        print(f"Result: {result}")
        
        if result and ("Summary" in result or "Note" in result or "No public flags" in result):
            print("✅ OSINT Service returned a valid formatted string.")
        else:
            print("❌ OSINT Service returned unexpected format or None.")
            
    except Exception as e:
        print(f"❌ Exception during check: {e}")

if __name__ == "__main__":
    verify_live_osint()
