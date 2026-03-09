from app import create_app, db
from app.models import User, Product, Order, OrderItem
import random
from datetime import datetime

def seed_market_basket_data():
    app = create_app()
    with app.app_context():
        # Get first user
        user = User.query.first()
        if not user:
            print("No users found.")
            return

        # Get some products
        products = Product.query.limit(10).all()
        if len(products) < 3:
            print("Not enough products.")
            return

        print(f"Creating sample multi-item orders for {user.username}...")

        # Create some typical bundle patterns
        # Bundle 1: Laptop + Mouse + Keyboard
        # Bundle 2: Monitor + Keyboard + Mouse
        # Bundle 3: Desktop + Monitor + Storage
        
        bundles = [
            # Select random products to form a bundle
            random.sample(products, 3),
            random.sample(products, 2),
            random.sample(products, 4),
            random.sample(products, 2),
            random.sample(products, 3),
        ]

        # Duplicate bundles to increase frequency/support/confidence
        for _ in range(5):
            for bundle in bundles:
                order = Order(
                    user_id=user.id,
                    total_amount=sum([p.price for p in bundle]),
                    status='delivered',
                    timestamp=datetime.utcnow()
                )
                db.session.add(order)
                db.session.flush() # get order id

                for p in bundle:
                    item = OrderItem(
                        order_id=order.id,
                        product_id=p.id,
                        quantity=1,
                        price_at_purchase=p.price
                    )
                    db.session.add(item)
                
        db.session.commit()
        print("Successfully created multi-item orders!")

if __name__ == '__main__':
    seed_market_basket_data()
