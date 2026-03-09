import sys
from app import create_app, db
from app.models import User, Product, Category, Order, SupportTicket, OrderItem
import traceback

def run_tests():
    print("Starting tests...")
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    client = app.test_client()

    with app.app_context():
        try:
            print("Creating DB...")
            db.create_all()
            print("DB Created.")
            
            # Setup Users
            print("Creating Users...")
            admin = User(username='admin', email='admin@test.com', role='admin')
            admin.set_password('admin123')
            staff = User(username='staff', email='staff@test.com', role='staff', is_approved=True)
            staff.set_password('staff123')
            customer = User(username='customer', email='customer@test.com', role='customer')
            customer.set_password('customer123')
            db.session.add_all([admin, staff, customer])
            db.session.commit()
            print("Users Created.")
            
            admin_id = admin.id
            staff_id = staff.id
            
            # Login Helper
            def get_headers(u, p):
                res = client.post('/api/auth/login', json={'username': u, 'password': p})
                token = res.get_json().get('access_token')
                if not token:
                    print(f"Login failed for {u}: {res.get_json()}")
                    sys.exit(1)
                return {'Authorization': f'Bearer {token}'}

            admin_headers = get_headers('admin', 'admin123')
            customer_headers = get_headers('customer', 'customer123')
            print("Login Successful.")

            print("--- Testing Category Management ---")
            res = client.post('/api/products/categories', json={'name': 'Electronics'}, headers=admin_headers)
            print(f"Add Category Status: {res.status_code}")
            if res.status_code == 201:
                cat_id = res.get_json()['id']
            else:
                print(f"Add Category Failed: {res.get_json()}")
                return

            print("\n--- Testing Order Management ---")
            print("Adding Product...")
            prod = Product(name='Phone', price=100.0, stock=10)
            db.session.add(prod)
            db.session.commit()
            print(f"Product Added: {prod.id}")
            
            print("Creating Order via API...")
            try:
                res = client.post('/api/orders/', json={'items': [{'id': prod.id, 'quantity': 1}]}, headers=customer_headers)
                print(f"Create Order Status: {res.status_code}")
                if res.status_code != 201:
                    print(f"Create Order Failed: {res.get_json()}")
                    return
                order_id = res.get_json()['order_id']
                print(f"Order Created: {order_id}")
            except Exception as e:
                print(f"Exception during order creation: {e}")
                traceback.print_exc()
                return

            # Update Status
            print("Updating Order...")
            res = client.patch(f'/api/orders/{order_id}/status', json={'status': 'shipped', 'tracking_number': 'TRK1'}, headers=admin_headers)
            print(f"Update Order Status: {res.status_code}")

            # Verify DB
            o = Order.query.get(order_id)
            print(f"Order Status in DB: {o.status}")

            print("\n--- Testing Support Flow ---")
            print("Creating Ticket...")
            res = client.post('/api/support/', json={'subject': 'Help', 'message': 'Msg'}, headers=customer_headers)
            print(f"Create Ticket Status: {res.status_code}")
            ticket_id = res.get_json()['ticket_id']
            
            print("Replying...")
            res = client.post(f'/api/support/{ticket_id}/message', json={'message': 'Reply'}, headers=admin_headers)
            print(f"Reply Status: {res.status_code}")

            print("\n--- Testing Staff Management ---")
            res = client.patch(f'/api/admin/staff/{staff_id}/status', json={'active': False}, headers=admin_headers)
            print(f"Disable Staff Status: {res.status_code}")

        except Exception as e:
            print(f"Global Exception: {e}")
            traceback.print_exc()

if __name__ == '__main__':
    run_tests()
