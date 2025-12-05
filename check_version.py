import requests
try:
    resp = requests.get("http://127.0.0.1:8000/api_status")
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
