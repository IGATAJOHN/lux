import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    # 1. Register
    reg_url = f"{BASE_URL}/auth/register-simple"
    email = f"staff_test_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    
    reg_payload = {
        "email": email,
        "password": password,
        "name": "Test Staff",
        "phone": "1234567890",
        "unique_id": uuid.uuid4().hex[:8]
    }
    
    print(f"--- Testing Registration for {email} ---")
    try:
        resp = requests.post(reg_url, json=reg_payload)
        print(f"Reg Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Reg Failed: {resp.text}")
            return
    except Exception as e:
        print(f"Connection Error: {e}")
        return

    # 2. Login
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "username": email,
        "password": password
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    print(f"--- Testing Login for {email} ---")
    try:
        resp = requests.post(login_url, data=login_payload, headers=headers)
        print(f"Login Status: {resp.status_code}")
        print(f"Login Response: {resp.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_flow()
