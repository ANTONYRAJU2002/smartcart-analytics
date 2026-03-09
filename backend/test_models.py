from app import create_app, db
from app.models import User, Product, Category, Order, SupportTicket

from config import Config

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True

app = create_app(TestConfig)

with app.app_context():
    try:
        db.create_all()
        print("Models initialized successfully.")
        u = User(username='test', email='test@test.com')
        db.session.add(u)
        db.session.commit()
        print("User created successfully.")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
