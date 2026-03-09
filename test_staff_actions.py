import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_staff_actions():
    print("Starting Staff Management Actions Verification...")
    session = requests.Session()
    
    # 1. Admin Login
    print("Logging in as admin...")
    admin_login = session.post(f"{BASE_URL}/auth/login", json={
        "username": "antony",
        "password": "1234"
    })
    if admin_login.status_code != 200:
        print(f"Admin login failed: {admin_login.json()}")
        return
    admin_token = admin_login.json().get('access_token')
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register a new staff user
    staff_username = f"staff_{int(time.time())}"
    print(f"Registering staff user: {staff_username}")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "username": staff_username,
        "email": f"{staff_username}@example.com",
        "password": "password123",
        "role": "staff"
    })
    if reg_res.status_code != 201:
        print(f"Staff registration failed: {reg_res.json()}")
        # Check if it fails because it's already registered or something else
        # Just in case, try login
        
    staff_id = None
    users_res = session.get(f"{BASE_URL}/admin/users", headers=admin_headers)
    for u in users_res.json():
        if u['username'] == staff_username:
            staff_id = u['id']
            break
    
    if not staff_id:
        print("Could not find registered staff ID")
        return

    print(f"Found Staff ID: {staff_id}")

    # 3. Approve Staff
    print("Approving staff...")
    approve_res = session.post(f"{BASE_URL}/admin/staff/{staff_id}/approve", headers=admin_headers)
    print(f"Approve Status: {approve_res.status_code} - {approve_res.json().get('msg')}")

    # 4. Disable Staff
    print("Disabling staff...")
    disable_res = session.patch(f"{BASE_URL}/admin/staff/{staff_id}/status", json={"active": False}, headers=admin_headers)
    print(f"Disable Status: {disable_res.status_code} - {disable_res.json().get('msg')}")

    # 5. Verify Disabled Status
    users_res = session.get(f"{BASE_URL}/admin/users", headers=admin_headers)
    for u in users_res.json():
        if u['id'] == staff_id:
            print(f"Current Active Status: {u['active']}")
            break

    # 6. Delete Staff
    print("Deleting staff...")
    delete_res = session.delete(f"{BASE_URL}/admin/staff/{staff_id}", headers=admin_headers)
    print(f"Delete Status: {delete_res.status_code} - {delete_res.json().get('msg')}")

    # 7. Final Verification
    users_res = session.get(f"{BASE_URL}/admin/users", headers=admin_headers)
    found = any(u['id'] == staff_id for u in users_res.json())
    print(f"User still exists in DB? {'Yes' if found else 'No'}")

if __name__ == "__main__":
    test_staff_actions()
