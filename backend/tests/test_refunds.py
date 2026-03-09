import unittest
from app import create_app, db
from app.models import Product, User, Order, Refund
from flask_jwt_extended import create_access_token

class RefundsTestCase(unittest.TestCase):
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
            self.access_token = create_access_token(identity=str(u.id))

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_request_refund_completed_order(self):
        # Create completed order
        with self.app.app_context():
            o = Order(user_id=self.user_id, total_amount=100, status='completed')
            db.session.add(o)
            db.session.commit()
            order_id = o.id

        headers = {'Authorization': f'Bearer {self.access_token}'}
        data = {'reason': 'Defective'}
        res = self.client.post(f'/api/orders/{order_id}/refund', json=data, headers=headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            o = Order.query.get(order_id)
            self.assertEqual(o.status, 'return_requested')
            r = Refund.query.first()
            self.assertIsNotNone(r)
            self.assertEqual(r.reason, 'Defective')

    def test_request_refund_pending_order(self):
        # Create pending order
        with self.app.app_context():
            o = Order(user_id=self.user_id, total_amount=100, status='pending')
            db.session.add(o)
            db.session.commit()
            order_id = o.id

        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.post(f'/api/orders/{order_id}/refund', json={'reason': 'bad'}, headers=headers)
        self.assertEqual(res.status_code, 400) # Should fail

    def test_double_refund_request(self):
        # Create completed order
        with self.app.app_context():
            o = Order(user_id=self.user_id, total_amount=100, status='completed')
            db.session.add(o)
            db.session.commit()
            order_id = o.id

        headers = {'Authorization': f'Bearer {self.access_token}'}
        self.client.post(f'/api/orders/{order_id}/refund', json={'reason': 'r1'}, headers=headers)
        
        # Request again
        res = self.client.post(f'/api/orders/{order_id}/refund', json={'reason': 'r2'}, headers=headers)
        self.assertEqual(res.status_code, 400) # Should fail

if __name__ == '__main__':
    unittest.main()
