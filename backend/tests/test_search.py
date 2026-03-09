import unittest
from app import create_app, db
from app.models import Product

class SearchTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            # Seed data
            p1 = Product(name='Sony Headphones', category='Audio', price=100)
            p2 = Product(name='Samsung Monitor', category='Computing', price=200)
            p3 = Product(name='Apple Watch', category='Wearables', price=300)
            db.session.add_all([p1, p2, p3])
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_search_by_name(self):
        # Test full match
        res = self.client.get('/api/products/?q=Sony')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Sony Headphones')

        # Test partial match (case insensitive)
        res = self.client.get('/api/products/?q=phone') # Should match Headphones
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Sony Headphones')

    def test_filter_by_category(self):
        res = self.client.get('/api/products/?category=Computing')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Samsung Monitor')

    def test_combined_filter(self):
        res = self.client.get('/api/products/?category=Audio&q=Sony')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 1)

        # No match
        res = self.client.get('/api/products/?category=Audio&q=Samsung')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 0)

if __name__ == '__main__':
    unittest.main()
