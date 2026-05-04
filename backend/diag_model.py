from app import create_app, db
from app.models import Product

app = create_app()
with app.app_context():
    p = Product(name="Test")
    print(f"Product columns: {Product.__table__.columns.keys()}")
    try:
        p2 = Product(name="Test 2", serial_numbers=[])
        print("Successfully created Product with serial_numbers")
    except TypeError as e:
        print(f"Failed to create Product with serial_numbers: {e}")
