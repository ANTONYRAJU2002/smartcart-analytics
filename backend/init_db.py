from app import create_app, db
# Import models so they are registered with SQLAlchemy
from app.models import User, Product, Order, OrderItem

app = create_app()

with app.app_context():
    db.create_all()
    print("Database tables created successfully.")
