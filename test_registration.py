"""
Test script to debug registration endpoint
"""
import requests
import base64
import json

# Create a simple 1x1 test image
test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Test registration data
data = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "phone": "1234567890",
    "unique_id": "TEST123",
    "selfie_image": test_image_base64
}

print("Testing registration endpoint...")
print(f"Sending data: {json.dumps({k: v if k != 'selfie_image' else '...' for k, v in data.items()}, indent=2)}")

try:
    response = requests.post("http://localhost:8000/auth/register", json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"\nError: {e}")
    if hasattr(e, 'response'):
        print(f"Response text: {e.response.text}")
