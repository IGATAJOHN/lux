import requests
import uuid

def create_fresh_staff():
    base_url = "http://127.0.0.1:8000"
    uid = uuid.uuid4().hex[:4]
    email = f"staff_{uid}@example.com"
    password = "password123"
    
    print(f"Attempting to create staff: {email}")
    
    url = f"{base_url}/staff/"
    payload = {
        "name": f"Staff Member {uid}",
        "email": email,
        "phone": "5550199",
        "department": "front_desk",
        "role": "staff",
        "password": password
    }
    
    try:
        resp = requests.post(url, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            print("\n✅ SUCCESS: Staff account created.")
            
            # Verify login immediately
            print("   Verifying login...")
            login_resp = requests.post(
                f"{base_url}/auth/login", 
                data={"username": email, "password": password},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if login_resp.status_code == 200:
                print("   ✅ Login Verification Passed.")
                print(f"\nCREDENTIALS FOR USER:\nEmail: {email}\nPassword: {password}")
            else:
                print(f"   ❌ Login Verification Failed: {login_resp.status_code} {login_resp.text}")
                print("   (This means the server might still be running old code that creates Staff but not User)")
                
        else:
            print(f"❌ Creation Failed: {resp.status_code}")
            print(resp.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_fresh_staff()
