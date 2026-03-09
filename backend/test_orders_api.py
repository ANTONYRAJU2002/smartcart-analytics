import requests

def test_api():
    base_url = "http://127.0.0.1:5000/api"
    
    # We need a token. I'll login first.
    # I'll create a user if not exists and login.
    from app import create_app, db
    from app.models import User, Address, Product
    
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(role='customer').first()
        if not user:
            user = User(username="apitester", email="tester@example.com", role='customer')
            user.set_password("password")
            db.session.add(user)
            db.session.commit()
        
        # Now login via API to get token
        login_data = {"username": user.username, "password": "password"}
        r = requests.post(f"{base_url}/auth/login", json=login_data)
        if r.status_code != 200:
            print(f"Login failed: {r.text}")
            return
        
        token = r.json().get('access_token')
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get address
        addr = Address.query.filter_by(user_id=user.id).first()
        if not addr:
            addr = Address(user_id=user.id, street="123 Test", city="Test", state="TS", zip_code="123", country="IN")
            db.session.add(addr)
            db.session.commit()
            
        # Get product
        prod = Product.query.first()
        
        # Test /orders/ (with slash)
        order_data = {
            "items": [{"id": prod.id, "quantity": 1}],
            "address_id": addr.id
        }
        
        print("\nTesting POST /api/orders/ (with trailing slash)")
        r1 = requests.post(f"{base_url}/orders/", json=order_data, headers=headers)
        print(f"Status: {r1.status_code}")
        print(f"Response: {r1.text}")
        
        print("\nTesting POST /api/orders (no trailing slash)")
        r2 = requests.post(f"{base_url}/orders", json=order_data, headers=headers)
        print(f"Status: {r2.status_code}")
        print(f"Response: {r2.text}")

if __name__ == "__main__":
    test_api()
