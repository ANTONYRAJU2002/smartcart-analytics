import requests
import json
import random
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:5000/api'
ADMIN_EMAIL = 'admin@smartcart.com'
ADMIN_PASSWORD = 'admin' # Assuming default, or we use the created admin

from app import create_app, db
from app.models import User

def ensure_admin():
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=ADMIN_EMAIL).first()
        if not user:
            print("Creating admin user...")
            user = User(username='Admin', email=ADMIN_EMAIL)
            user.set_password(ADMIN_PASSWORD)
            user.role = 'admin'
            user.is_approved = True
            db.session.add(user)
            db.session.commit()
            print("Admin user created.")
        else:
            print("Admin user exists. Resetting password...")
            user.set_password(ADMIN_PASSWORD)
            db.session.commit()
            print("Password reset to default.")

def login(email, password):
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": email,
        "password": password
    })
    if response.status_code == 200:
        return response.json()['access_token']
    print(f"Login failed: {response.status_code} - {response.text}")
    return None

def verify_dashboard(token):
    print("\n--- Verifying Dashboard ---")
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"Total Revenue: {data.get('total_revenue')}")
        print(f"Online Revenue: {data.get('online_revenue')}")
        print(f"Offline Revenue: {data.get('offline_revenue')}")
        print(f"Recent Transactions: {len(data.get('recent_transactions', []))}")
        return data
    else:
        print(f"Failed to fetch dashboard: {response.status_code} - {response.text}")
        return None

def post_offline_sale(token):
    print("\n--- Posting Offline Sale ---")
    headers = {'Authorization': f'Bearer {token}'}
    sale_data = {
        "date": datetime.now().strftime('%Y-%m-%d'),
        "total_sales": 5000.00,
        "total_profit": 1500.00
    }
    response = requests.post(f"{BASE_URL}/offline", json=sale_data, headers=headers)
    if response.status_code == 201:
        print("Offline sale posted successfully.")
        return True
    else:
        print(f"Failed to post offline sale: {response.text}")
        return False

def verify_segments_and_associations(token):
    headers = {'Authorization': f'Bearer {token}'}
    
    print("\n--- Verifying Segments ---")
    try:
        res_seg = requests.get(f"{BASE_URL}/analytics/segments", headers=headers)
        if res_seg.status_code == 200:
            segs = res_seg.json()
            print(f"Found {len(segs)} customer segments.")
        else:
            print(f"Segments endpoint failed: {res_seg.status_code}")
    except Exception as e:
        print(f"Segments check error: {e}")

    print("\n--- Verifying Market Basket ---")
    try:
        res_assoc = requests.get(f"{BASE_URL}/analytics/associations", headers=headers)
        if res_assoc.status_code == 200:
            rules = res_assoc.json()
            print(f"Found {len(rules)} association rules.")
        else:
            print(f"Associations endpoint failed: {res_assoc.status_code}")
    except Exception as e:
        print(f"Associations check error: {e}")

def main():
    # 0. Ensure Admin
    ensure_admin()

    # 1. Login
    token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not token:
        # Try registering if login fails (unlikely given previous steps, but safe fallback)
        print("Login failed, attempting manual check or user user creation needed.")
        return

    # 2. Check Initial Stats
    initial_stats = verify_dashboard(token)
    if not initial_stats:
        return

    # 3. Simulate Integration
    if post_offline_sale(token):
        # 4. Verify Update
        print("Checking for updates...")
        updated_stats = verify_dashboard(token)
        
        diff = updated_stats['offline_revenue'] - initial_stats['offline_revenue']
        if diff == 5000.0:
            print("SUCCESS: Dashboard updated correctly with offline sale.")
        else:
            print(f"WARNING: Dashboard update mismatch. Diff: {diff}")

    # 5. Check Advanced Analytics
    verify_segments_and_associations(token)

if __name__ == "__main__":
    main()
