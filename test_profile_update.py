import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_profile_update():
    print("Starting Profile Contact Number Verification...")
    session = requests.Session()
    
    # 1. Login
    print("Logging in...")
    login_res = session.post(f"{BASE_URL}/auth/login", json={
        "username": "antony",
        "password": "1234"
    })
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.json()}")
        return
    token = login_res.json().get('access_token')
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update Phone Number
    test_phone = "9876543210"
    print(f"Updating phone number to: {test_phone}")
    update_res = session.patch(f"{BASE_URL}/auth/profile", json={"phone_number": test_phone}, headers=headers)
    print(f"Update Result: {update_res.status_code} - {update_res.json().get('msg')}")

    # 3. Fetch Profile and Verify
    print("Fetching profile to verify...")
    prof_res = session.get(f"{BASE_URL}/auth/profile", headers=headers)
    prof_data = prof_res.json()
    received_phone = prof_data.get('phone_number')
    print(f"Received Phone: {received_phone}")
    
    if received_phone == test_phone:
        print("Success! Contact number correctly saved and retrieved.")
    else:
        print("Failure! Contact number does not match.")

if __name__ == "__main__":
    test_profile_update()
