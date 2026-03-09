import unittest
from app import create_app, db
from app.models import User, Product, Wishlist
from flask_jwt_extended import create_access_token

class WishlistTestCase(unittest.TestCase):
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

    def test_add_to_wishlist(self):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.post(f'/api/products/{self.product_id}/wishlist', headers=headers)
        self.assertEqual(res.status_code, 201)
        
        with self.app.app_context():
            w = Wishlist.query.filter_by(user_id=self.user_id).first()
            self.assertIsNotNone(w)
            self.assertEqual(w.product_id, self.product_id)

    def test_remove_from_wishlist(self):
        # Add first
        with self.app.app_context():
            w = Wishlist(user_id=self.user_id, product_id=self.product_id)
            db.session.add(w)
            db.session.commit()
            
        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.delete(f'/api/products/{self.product_id}/wishlist', headers=headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            w = Wishlist.query.filter_by(user_id=self.user_id).first()
            self.assertIsNone(w)

    def test_get_wishlist(self):
        with self.app.app_context():
            w = Wishlist(user_id=self.user_id, product_id=self.product_id)
            db.session.add(w)
            db.session.commit()
            
        headers = {'Authorization': f'Bearer {self.access_token}'}
        res = self.client.get('/api/products/wishlist', headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json), 1)
        self.assertEqual(res.json[0]['id'], self.product_id)

if __name__ == '__main__':
    unittest.main()
