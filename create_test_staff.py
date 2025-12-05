import requests
import json

def create_staff_via_api():
    base_url = "http://127.0.0.1:8000"
    import uuid
    # Use a clean, recognizable email for the user
    email = f"staff_new_{uuid.uuid4().hex[:4]}@example.com"
    password = "password123"
    
    # 1. Create Staff (which auto-creates User)
    url = f"{base_url}/staff/"
    payload = {
        "name": "John Staff via API",
        "email": email,
        "phone": "9876543210",
        "department": "concierge",
        "role": "staff",
        "password": password
    }
    
    print(f"Creating staff account via API: {email}...")
    try:
        resp = requests.post(url, json=payload)
        if resp.status_code == 200:
            print("✅ Staff created successfully!")
            print(f"Full Response: {resp.text}")
            print(f"ID: {resp.json().get('id')}")
            print(f"User ID: {resp.json().get('user_id')}")
        else:
            print(f"❌ Creation Failed: {resp.status_code} - {resp.text}")
            # If already exists, we can still try login
            if "already registered" in resp.text:
                print("   (Account might already exist, proceeding to test login)")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Verify Login
    login_url = f"{base_url}/auth/login"
    login_data = {
        "username": email,
        "password": password
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    print("Testing login with new credentials...")
    try:
        resp = requests.post(login_url, data=login_data, headers=headers)
        if resp.status_code == 200:
            print("✅ API Login SUCCESS!")
            print(f"Token received: {json.loads(resp.text)['access_token'][:10]}...")
            print("\nSUCCESS! You can verify this account in the browser.")
        else:
            print(f"❌ API Login Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Validation Error: {e}")

if __name__ == "__main__":
    create_staff_via_api()
