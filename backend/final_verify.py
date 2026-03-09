import requests

BASE_URL = "http://localhost:5000/api"
TOKEN_CUSTOMER = "eyJhbGci..." # I'll paste the actual tokens here or use a script to read them.
# Actually, I'll just write a script that does IT ALL IN ONE GO to avoid copying strings.

def final_verify():
    from app import create_app
    from app.models import User, Order, Refund
    from flask_jwt_extended import create_access_token
    import requests

    app = create_app()
    with app.app_context():
        # 1. Get tokens
        user = User.query.filter_by(role='customer').first()
        token_u = create_access_token(identity=str(user.id))
        admin = User.query.filter_by(role='admin').first()
        token_a = create_access_token(identity=str(admin.id))
        
        headers_u = {"Authorization": f"Bearer {token_u}"}
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 2. Find order
        order = Order.query.filter_by(user_id=user.id).first()
        if not order:
            print("No order for user")
            # Create a dummy order if needed, but let's assume one exists
            return

        print(f"Testing with User: {user.username}, Order: {order.id}")

        # 3. Request Refund
        res = requests.post(f"{BASE_URL}/orders/{order.id}/refund", 
                            json={"reason": "Verification Test"}, headers=headers_u)
        print(f"Refund Request: {res.status_code} - {res.json()}")
        ticket_id = res.json().get('ticket_id')

        # 4. Check Admin List
        res = requests.get(f"{BASE_URL}/support/all", headers=headers_a)
        tickets = res.json()
        found = next((t for t in tickets if t['id'] == ticket_id), None)
        print(f"Admin Ticket List: Found={found is not None}, is_refund={found.get('is_refund') if found else 'N/A'}")

        # 5. Admin Action
        res = requests.post(f"{BASE_URL}/support/{ticket_id}/action",
                            json={"action": "approve_refund", "order_id": order.id}, headers=headers_a)
        print(f"Admin Action Status: {res.status_code} - {res.json()}")

        # 6. Final Status Check
        from app.models import Order
        order_check = Order.query.get(order.id)
        print(f"Final Order Status: {order_check.status}")
        if order_check.status == 'returned':
            print("--- FINAL VERIFICATION SUCCESSFUL ---")

if __name__ == "__main__":
    final_verify()
