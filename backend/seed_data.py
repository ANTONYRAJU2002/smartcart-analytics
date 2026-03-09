from app import create_app, db
from app.models import User, Product

app = create_app()

def seed_data():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        # Create Users
        admin = User(username='admin', email='admin@smartcart.com', role='admin')
        admin.set_password('admin123')
        
        staff = User(username='staff', email='staff@smartcart.com', role='staff')
        staff.set_password('staff123')

        customer = User(username='alice', email='alice@example.com', role='customer')
        customer.set_password('password')

        db.session.add_all([admin, staff, customer])

        # Create Products
        p1 = Product(name='Predator Helios 300', category='Laptops', price=1399.0, cost_price=1100.0)
        p2 = Product(name='Samsung Odyssey G7 32"', category='Monitors', price=699.99, cost_price=450.0)
        p3 = Product(name='RTX 4080 Super', category='Computer Components', price=999.0, cost_price=800.0)
        
        db.session.add_all([p1, p2, p3])
        
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_data()
