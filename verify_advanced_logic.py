import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_advanced_logic():
    print("Starting Advanced Logic Verification...")
    
    # 1. Setup - Create a user and an out-of-stock product
    session = requests.Session()
    username = f"testuser_{int(time.time())}"
    email = f"{username}@example.com"
    
    print(f"Registering user: {username}")
    reg_res = session.post(f"{BASE_URL}/auth/register", json={
        "username": username,
        "email": email,
        "password": "password123"
    })
    
    login_res = session.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": "password123"
    })
    token = login_res.json().get('access_token')
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Smart Recommendations (Fallback)
    print("Testing Related Products (Fallback to Category)...")
    prod_res = session.get(f"{BASE_URL}/products")
    products = prod_res.json()
    if not products:
        print("No products available to test.")
        return
        
    p1 = products[0]
    related_res = session.get(f"{BASE_URL}/products/{p1['id']}/related")
    related = related_res.json()
    print(f"Found {len(related)} related products for '{p1['name']}'")
    
    # 3. Test Stock Notification
    # Find or make an out-of-stock product
    # For testing, we'll try to notify for the first product (even if it has stock, it should fail)
    print("Testing Stock Notification (Expected failure if in stock)...")
    notify_res = session.post(f"{BASE_URL}/products/{p1['id']}/notify", headers=headers)
    print(f"Notify result: {notify_res.status_code} - {notify_res.json().get('msg')}")

    # 4. Test Refund Request
    # Need an admin to complete an order
    admin_login = session.post(f"{BASE_URL}/auth/login", json={
        "username": "antony",
        "password": "1234"
    })
    admin_token = admin_login.json().get('access_token')
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    print("Creating and completing an order for refund test...")
    # Add to cart (Optional for this API, as we pass items directly to check out)
    # session.post(f"{BASE_URL}/cart", json={"product_id": p1['id'], "quantity": 1}, headers=headers)
    
    # Checkout (Correctly passing items)
    checkout_res = session.post(f"{BASE_URL}/orders", json={
        "shipping_address": "123 Test St, Test City",
        "items": [{"id": p1['id'], "quantity": 1}]
    }, headers=headers)
    order_id = checkout_res.json().get('order_id')
    print(f"Checkout Response: {checkout_res.json()}")
    print(f"Order created: #{order_id}")
    
    # Admin completes order
    session.patch(f"{BASE_URL}/orders/{order_id}/status", json={"status": "completed"}, headers=admin_headers)
    print("Order marked as completed by admin.")
    
    # User requests refund
    print("Requesting refund...")
    refund_res = session.post(f"{BASE_URL}/orders/{order_id}/refund", json={"reason": "Testing return logic"}, headers=headers)
    print(f"Refund request status: {refund_res.status_code}")
    
    # 5. Admin Actions Refund
    print("Admin listing refunds...")
    all_refunds_res = session.get(f"{BASE_URL}/orders/admin/refunds", headers=admin_headers)
    refunds = all_refunds_res.json()
    target_refund = next((r for r in refunds if r['order_id'] == order_id), None)
    
    if target_refund:
        print(f"Found target refund: ID {target_refund['id']}")
        action_res = session.post(f"{BASE_URL}/orders/admin/refunds/{target_refund['id']}/action", 
                                  json={"action": "approve"}, headers=admin_headers)
        print(f"Refund action (approve) result: {action_res.status_code}")
        
        # Verify order status
        verify_order = session.get(f"{BASE_URL}/orders/my", headers=headers)
        order_status = next((o['status'] for o in verify_order.json() if o['id'] == order_id), None)
        print(f"Verified Order #{order_id} status: {order_status}")
    else:
        print("Refund not found in admin list.")

if __name__ == "__main__":
    test_advanced_logic()
