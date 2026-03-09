import unittest
from app import create_app, db
from app.models import User, Product, Address, Order
from flask_jwt_extended import create_access_token

class CheckoutTestCase(unittest.TestCase):
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
            
            # Create address
            addr = Address(user_id=self.user_id, street='123 Main St', city='Test City', state='TS', zip_code='12345', country='Testland', is_default=True)
            db.session.add(addr)
            db.session.commit()
            self.address_id = addr.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_checkout_flow(self):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        
        # Place order
        data = {
            'items': [{'id': self.product_id, 'quantity': 2}],
            'address_id': self.address_id
        }
        res = self.client.post('/api/orders/', json=data, headers=headers)
        self.assertEqual(res.status_code, 201)
        
        # Verify order content
        with self.app.app_context():
            order = Order.query.filter_by(user_id=self.user_id).first()
            self.assertIsNotNone(order)
            self.assertEqual(order.total_amount, 200)
            self.assertIn('123 Main St', order.shipping_address)
            self.assertIn('Test City', order.shipping_address)

if __name__ == '__main__':
    unittest.main()
