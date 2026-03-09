import unittest
from app import create_app, db
from app.models import User, Order, Product, OrderItem
from flask_jwt_extended import create_access_token
from datetime import datetime

class InvoiceTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Create user
            u = User(username='testuser', email='test@test.com')
            u.set_password('password')
            db.session.add(u)
            
            # Create product
            p = Product(name='Test Product', price=100)
            db.session.add(p)
            
            db.session.commit()
            
            self.user_id = u.id
            self.product_id = p.id
            self.access_token = create_access_token(identity=str(u.id))

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_get_invoice(self):
        # Create completed order
        with self.app.app_context():
            o = Order(user_id=self.user_id, total_amount=100, status='completed')
            db.session.add(o)
            db.session.commit()
            
            oi = OrderItem(order_id=o.id, product_id=self.product_id, quantity=1, price_at_purchase=100)
            db.session.add(oi)
            db.session.commit()
            
            order_id = o.id

        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.get(f'/api/orders/{order_id}/invoice', headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'INVOICE', res.data)
        self.assertIn(b'testuser', res.data)
        self.assertIn(b'Test Product', res.data)

    def test_get_invoice_invalid_order(self):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.get('/api/orders/999/invoice', headers=headers)
        self.assertEqual(res.status_code, 404)

if __name__ == '__main__':
    unittest.main()
