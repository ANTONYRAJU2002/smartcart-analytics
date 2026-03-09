import unittest
from app import create_app, db
from app.models import User, SupportTicket, TicketMessage
from flask_jwt_extended import create_access_token

class SupportTestCase(unittest.TestCase):
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

    def test_create_ticket(self):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        data = {'subject': 'Help', 'message': 'I need help'}
        
        res = self.client.post('/api/support/', json=data, headers=headers)
        self.assertEqual(res.status_code, 201)
        
        with self.app.app_context():
            t = SupportTicket.query.first()
            self.assertIsNotNone(t)
            self.assertEqual(t.subject, 'Help')
            self.assertEqual(t.messages.count(), 1)
            self.assertEqual(t.messages.first().message, 'I need help')

    def test_reply_ticket(self):
        # Create ticket
        with self.app.app_context():
            t = SupportTicket(user_id=self.user_id, subject='Issue')
            db.session.add(t)
            db.session.commit()
            ticket_id = t.id

        headers = {'Authorization': f'Bearer {self.access_token}'}
        data = {'message': 'Reply'}
        res = self.client.post(f'/api/support/{ticket_id}/message', json=data, headers=headers)
        self.assertEqual(res.status_code, 201)
        
        with self.app.app_context():
            t = SupportTicket.query.get(ticket_id)
            self.assertEqual(t.messages.count(), 1)
            self.assertEqual(t.messages.first().message, 'Reply')

if __name__ == '__main__':
    unittest.main()
