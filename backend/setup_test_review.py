from app import create_app, db
from app.models import User, Order, OrderItem, Product
from datetime import datetime

app = create_app()
with app.app_context():
    # 1. Create Test User
    user = User.query.filter_by(username='test_buyer').first()
    if not user:
        user = User(username='test_buyer', email='test@example.com', role='customer')
        user.set_password('password123')
        db.session.add(user)
        db.session.flush()
        print("Created test user: test_buyer / password123")
    
    # 2. Find a Product
    product = Product.query.first()
    if not product:
        print("No products in DB!")
    else:
        # 3. Create a Delivered Order
        order = Order(user_id=user.id, status='delivered', total_amount=product.price, shipping_address='Test St 123')
        db.session.add(order)
        db.session.flush()
        
        item = OrderItem(order_id=order.id, product_id=product.id, quantity=1, price_at_purchase=product.price)
        db.session.add(item)
        db.session.commit()
        print(f"Created Delivered Order #{order.id} for Product: {product.name}")
