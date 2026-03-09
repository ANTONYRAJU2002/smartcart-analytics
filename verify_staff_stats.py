import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api"

def run_test():
    print("--- STARTING ROBUST VERIFICATION ---")
    
    # 1. Health
    try:
        r = requests.get(f"http://127.0.0.1:5000/health", timeout=5)
    except Exception as e:
        print(f"Health check FAIL: {e}")
        return

    # 2. Register Staff
    ts = int(time.time())
    username = f"v_staff_{ts}"
    staff_email = f"{username}@internal.com"
    reg_payload = {"username": username, "email": staff_email, "password": "password123", "role": "staff"}
    print(f"Registering: {username}")
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)

    # 3. Login Admin (Corrected Credentials)
    print("Logging in as Admin (antony)...")
    admin_payload = {"username": "antony@gmail.com", "password": "1234"}
    r = requests.post(f"{BASE_URL}/auth/login", json=admin_payload)
    admin_token = r.json().get('access_token')
    if not admin_token:
        print(f"Admin login FAILED: {r.text}")
        return

    # 4. Find Staff ID
    r = requests.get(f"{BASE_URL}/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    users = r.json()
    staff_user = next((u for u in users if u['username'] == username), None)
    if not staff_user:
        print(f"Could not find staff {username}")
        return
    staff_id = staff_user['id']
    print(f"Found staff ID: {staff_id}")

    # 5. Approve Staff
    print("Approving staff...")
    r = requests.post(f"{BASE_URL}/admin/staff/{staff_id}/approve", headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Approve status: {r.status_code}")

    # 6. Login Staff
    print("Logging in as Staff...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": "password123"})
    staff_token = r.json().get('access_token')

    # 7. Add Data
    print("Adding sales record...")
    r = requests.post(f"{BASE_URL}/offline/", json={"date": "2026-02-21", "total_sales": 777.77, "total_profit": 77.77}, headers={"Authorization": f"Bearer {staff_token}"})

    # 8. Check Stats
    print("Checking STATS endpoint...")
    r = requests.get(f"{BASE_URL}/offline/stats", headers={"Authorization": f"Bearer {staff_token}"})
    stats = r.json()
    print(f"Final Stats: {json.dumps(stats, indent=2)}")

    assert stats['total_sales'] == 777.77
    assert stats['entry_count'] == 1
    assert stats['is_approved'] == True
    
    print("\nVERIFICATION COMPLETE - STAFF PORTAL LOGIC IS SOLID")

if __name__ == "__main__":
    run_test()
