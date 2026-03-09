import unittest
from app import create_app, db
from app.models import Product, User, Review
from flask_jwt_extended import create_access_token

class ReviewsTestCase(unittest.TestCase):
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

    def test_add_review(self):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        data = {'rating': 5, 'comment': 'Great product!'}
        
        res = self.client.post(f'/api/products/{self.product_id}/reviews', json=data, headers=headers)
        self.assertEqual(res.status_code, 201)
        
        with self.app.app_context():
            review = Review.query.first()
            self.assertIsNotNone(review)
            self.assertEqual(review.rating, 5)
            self.assertEqual(review.comment, 'Great product!')

    def test_get_reviews(self):
        # Add a review directly
        with self.app.app_context():
            r = Review(user_id=self.user_id, product_id=self.product_id, rating=4, comment='Good')
            db.session.add(r)
            db.session.commit()

        res = self.client.get(f'/api/products/{self.product_id}/reviews')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['rating'], 4)
        self.assertEqual(data[0]['comment'], 'Good')
        self.assertEqual(data[0]['user'], 'testuser')

if __name__ == '__main__':
    unittest.main()
