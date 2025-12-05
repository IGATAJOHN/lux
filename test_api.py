import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    # 1. Register
    print("Testing Registration...")
    reg_data = {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "phone": "1234567890",
        "unique_id": "UID123",
        "selfie_image": "base64_mock_image"
    }
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
        print(f"Register Status: {resp.status_code}")
        if resp.status_code != 200:
            print(resp.json())
    except Exception as e:
        print(f"Registration failed: {e}")

    # 2. Login
    print("\nTesting Login...")
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    token = None
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print(f"Login Status: {resp.status_code}")
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            print("Token received")
        else:
            print(resp.json())
    except Exception as e:
        print(f"Login failed: {e}")

    if not token:
        print("Skipping authenticated tests due to login failure")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get User Profile
    print("\nTesting User Profile...")
    resp = requests.get(f"{BASE_URL}/user/me", headers=headers)
    print(f"Profile Status: {resp.status_code}")
    print(resp.json())

    # 4. Create Booking
    print("\nTesting Booking Creation...")
    booking_data = {
        "check_in_date": "2023-12-25T14:00:00",
        "check_out_date": "2023-12-30T11:00:00",
        "room_type": "suite"
    }
    resp = requests.post(f"{BASE_URL}/booking/create", json=booking_data, headers=headers)
    print(f"Booking Status: {resp.status_code}")
    print(resp.json())

    # 5. AI Fraud Score
    print("\nTesting AI Fraud Score...")
    resp = requests.post(f"{BASE_URL}/ai/fraud-score")
    print(f"Fraud Score Status: {resp.status_code}")
    print(resp.json())

    # 6. Notifications
    print("\nTesting Notifications...")
    notify_data = {"message": "Welcome!", "guest_id": 1}
    resp = requests.post(f"{BASE_URL}/notify/guest", json=notify_data)
    print(f"Notify Guest Status: {resp.status_code}")
    print(resp.json())

    # 7. Staff
    print("\nTesting Staff List...")
    resp = requests.get(f"{BASE_URL}/staff/")
    print(f"Staff List Status: {resp.status_code}")
    print(resp.json())

    # 8. Admin Lists
    print("\nTesting Admin Lists...")
    resp = requests.get(f"{BASE_URL}/admin/guests")
    print(f"Admin Guests Status: {resp.status_code}")
    
    # 9. Additional AI
    print("\nTesting AI Churn...")
    resp = requests.get(f"{BASE_URL}/ai/churn?guestId=1")
    print(f"AI Churn Status: {resp.status_code}")
    print(resp.json())

    # 10. Face Enroll
    print("\nTesting Face Enroll...")
    enroll_data = {"selfie_image": "new_face_base64"}
    resp = requests.post(f"{BASE_URL}/auth/face-enroll", json=enroll_data, headers=headers)
    print(f"Face Enroll Status: {resp.status_code}")
    print(resp.json())

if __name__ == "__main__":
    test_api()
