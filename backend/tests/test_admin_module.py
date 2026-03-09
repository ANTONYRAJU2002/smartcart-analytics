import unittest
import json
from app import create_app, db
from app.models import User, Product, Category, Order, SupportTicket, TicketMessage
from config import Config

class TestAdminModule(unittest.TestCase):
    def setUp(self):
        class TestConfig(Config):
            TESTING = True
            SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
            SQLALCHEMY_TRACK_MODIFICATIONS = False

        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            self.create_users()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()

    def create_users(self):
        # Admin
        self.admin = User(username='admin', email='admin@test.com', role='admin')
        self.admin.set_password('admin123')
        
        # Staff
        self.staff = User(username='staff', email='staff@test.com', role='staff', is_approved=True)
        self.staff.set_password('staff123')

        # Customer
        self.customer = User(username='customer', email='customer@test.com', role='customer')
        self.customer.set_password('customer123')
        
        db.session.add_all([self.admin, self.staff, self.customer])
        db.session.commit()

        # Store IDs instead of objects to avoid DetachedInstanceError
        self.admin_id = self.admin.id
        self.staff_id = self.staff.id
        self.customer_id = self.customer.id

        self.admin_headers = self.get_auth_header('admin', 'admin123')
        self.customer_headers = self.get_auth_header('customer', 'customer123')

    def get_auth_header(self, username, password):
        res = self.client.post('/api/auth/login', json={'username': username, 'password': password})
        token = res.get_json()['access_token']
        return {'Authorization': f'Bearer {token}'}

    def test_category_management(self):
        # Add Category
        res = self.client.post('/api/products/categories', json={'name': 'Electronics'}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 201)
        cat_id = res.get_json()['id']

        # List Categories
        res = self.client.get('/api/products/categories')
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Electronics')

        # Delete Category
        res = self.client.delete(f'/api/products/categories/{cat_id}', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)

    def test_order_management(self):
        # Create Order (Customer)
        # Needs product first
        with self.app.app_context():
            prod = Product(name='Phone', price=100.0, stock=10)
            db.session.add(prod)
            db.session.commit()
            prod_id = prod.id
        
        res = self.client.post('/api/orders/', json={'items': [{'id': prod_id, 'quantity': 1}]}, headers=self.customer_headers)
        order_id = res.get_json()['order_id']

        # Admin Update Status
        res = self.client.patch(f'/api/orders/{order_id}/status', json={'status': 'shipped', 'tracking_number': 'TRK123'}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        
        # Verify
        with self.app.app_context():
            order = Order.query.get(order_id)
            self.assertEqual(order.status, 'shipped')
            self.assertEqual(order.tracking_number, 'TRK123')

        # Admin Update Payment
        res = self.client.patch(f'/api/orders/{order_id}/payment', json={'payment_status': 'paid'}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            order = Order.query.get(order_id)
            self.assertEqual(order.payment_status, 'paid')

        # Admin List Orders
        res = self.client.get('/api/orders/all', headers=self.admin_headers) # Updated endpoint
        self.assertEqual(res.status_code, 200)
        self.assertIn('payment_status', res.get_json()[0])

    def test_support_flow(self):
        # Create Ticket (Customer)
        res = self.client.post('/api/support/', json={'subject': 'Issue', 'message': 'Help'}, headers=self.customer_headers)
        ticket_id = res.get_json()['ticket_id']

        # Admin Reply
        res = self.client.post(f'/api/support/{ticket_id}/message', json={'message': 'We are on it'}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 201)
        
        # Verify Message
        res = self.client.get(f'/api/support/{ticket_id}', headers=self.customer_headers)
        messages = res.get_json()['messages']
        self.assertEqual(len(messages), 2) # Initial + Reply

        # Admin List All
        res = self.client.get('/api/support/all', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.get_json()), 1)

    def test_staff_management(self):
        # List Staff
        res = self.client.get('/api/admin/users', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        
        # Check if is_approved is present in the response
        admin_user = next(u for u in data if u['username'] == 'admin')
        staff_user = next(u for u in data if u['username'] == 'staff')
        
        self.assertIn('is_approved', admin_user)
        self.assertIn('is_approved', staff_user)
        self.assertTrue(staff_user['is_approved'])
        
        # Disable Staff
        res = self.client.patch(f'/api/admin/staff/{self.staff_id}/status', json={'active': False}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            staff = User.query.get(self.staff_id)
            self.assertFalse(staff.active)

        # Delete Staff
        res = self.client.delete(f'/api/admin/staff/{self.staff_id}', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            staff = User.query.get(self.staff_id)
            self.assertIsNone(staff)

if __name__ == '__main__':
    unittest.main()
