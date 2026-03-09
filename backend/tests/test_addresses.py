import unittest
from app import create_app, db
from app.models import User, Address
from flask_jwt_extended import create_access_token

class AddressTestCase(unittest.TestCase):
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
            db.session.commit()
            
            self.user_id = u.id
            self.access_token = create_access_token(identity=str(u.id))

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_add_address(self):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        data = {
            'street': '123 Test St',
            'city': 'Test City',
            'state': 'TS',
            'zip_code': '12345',
            'country': 'Testland'
        }
        res = self.client.post('/api/user/addresses', json=data, headers=headers)
        self.assertEqual(res.status_code, 201)
        
        with self.app.app_context():
            addr = Address.query.filter_by(user_id=self.user_id).first()
            self.assertIsNotNone(addr)
            self.assertEqual(addr.city, 'Test City')
            self.assertTrue(addr.is_default) # First address should be default

    def test_get_addresses(self):
        with self.app.app_context():
            addr = Address(user_id=self.user_id, street='123 St', city='City', state='State', zip_code='000', country='Country')
            db.session.add(addr)
            db.session.commit()
            
        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.get('/api/user/addresses', headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json), 1)

    def test_delete_address(self):
        with self.app.app_context():
            addr = Address(user_id=self.user_id, street='123 St', city='City', state='State', zip_code='000', country='Country')
            db.session.add(addr)
            db.session.commit()
            addr_id = addr.id
            
        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.delete(f'/api/user/addresses/{addr_id}', headers=headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            addr = Address.query.get(addr_id)
            self.assertIsNone(addr)

if __name__ == '__main__':
    unittest.main()
