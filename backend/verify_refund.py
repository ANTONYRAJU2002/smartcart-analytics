import requests
import json

BASE_URL = "http://localhost:5000/api"

def verify_system():
    try:
        # 1. Login as user
        print("Logging in as customer 'p'...")
        login_res = requests.post(f"{BASE_URL}/auth/login", json={"username": "p", "password": "p"}, timeout=5)
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
        token = login_res.json()['access_token']
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Find an order to refund
        print("Fetching orders...")
        orders_res = requests.get(f"{BASE_URL}/orders", headers=headers)
        orders = orders_res.json()
        order_to_refund = None
        for o in orders:
            if o['status'] not in ['returned', 'return_requested']:
                order_to_refund = o
                break
        
        if not order_to_refund:
            print("No new order found to refund. Using first available.")
            if orders:
                order_to_refund = orders[0]
            else:
                return

        # 3. Request refund
        print(f"Requesting refund for Order #{order_to_refund['id']}...")
        refund_res = requests.post(
            f"{BASE_URL}/orders/{order_to_refund['id']}/refund", 
            json={"reason": "Testing the auto-ticket system v2"},
            headers=headers
        )
        print(refund_res.json())
        
        ticket_id = refund_res.json().get('ticket_id')
        print(f"Auto-generated Ticket ID: {ticket_id}")

        if ticket_id:
            # 4. Verify ticket in support
            print("Verifying ticket in support...")
            support_res = requests.get(f"{BASE_URL}/support", headers=headers)
            tickets = support_res.json()
            found = any(t['id'] == ticket_id for t in tickets)
            if found:
                print("SUCCESS: Ticket found in customer's support list.")
            else:
                print("FAILURE: Ticket not found.")

        # 5. Admin Login
        print("Logging in as Admin...")
        admin_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "Admin", "password": "Admin"})
        admin_token = admin_login.json()['access_token']
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 6. Admin Ticket list check
        print("Checking admin ticket list...")
        all_tickets_res = requests.get(f"{BASE_URL}/support/all", headers=admin_headers)
        all_tickets = all_tickets_res.json()
        for t in all_tickets:
            if t['id'] == ticket_id:
                print(f"Admin Ticket #{t['id']} Audit - subject: {t['subject']}, is_refund: {t.get('is_refund')}")
                if t.get('is_refund'):
                    print("SUCCESS: Admin view identifies ticket as a refund request.")
                break

        # 7. Admin Action
        print(f"Admin approving refund for Ticket #{ticket_id}...")
        action_res = requests.post(
            f"{BASE_URL}/support/{ticket_id}/action",
            json={"action": "approve_refund", "order_id": order_to_refund['id']},
            headers=admin_headers
        )
        print(action_res.json())

    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_system()
