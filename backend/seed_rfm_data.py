from app import create_app, db
from app.models import User, Order, OrderItem, Product
from datetime import datetime, timedelta
import random

app = create_app()

def seed_rfm():
    with app.app_context():
        # 1. Get targets
        dona = User.query.filter_by(username='Dona').first() or User.query.get(2)
        arjun = User.query.filter_by(username='Arjun').first() or User.query.get(3)
        test_user = User.query.filter_by(username='Test User').first() or User.query.get(5)
        antony = User.query.filter_by(username='antony').first() or User.query.get(25)
        
        prods = Product.query.limit(10).all()
        if not prods: 
            print("No products found to seed orders!")
            return

        # Helper to create order
        def create_order(user, days_ago, val_mult=1):
            ts = datetime.utcnow() - timedelta(days=days_ago)
            order = Order(
                user_id=user.id,
                timestamp=ts,
                total_amount=0,
                status='delivered',
                payment_status='paid'
            )
            db.session.add(order)
            db.session.flush() # Get ID
            
            total = 0
            # Add 1-3 items
            for _ in range(random.randint(1, 3)):
                p = random.choice(prods)
                qty = random.randint(1, 2)
                price = p.price * val_mult
                item = OrderItem(
                    order_id=order.id,
                    product_id=p.id,
                    quantity=qty,
                    price_at_purchase=price
                )
                db.session.add(item)
                total += price * qty
            
            order.total_amount = total
            return order

        print("Seeding VIP Whales (Dona & Antony)...")
        # Dona: 12 orders, very recent, expensive
        if dona:
            for i in range(12):
                create_order(dona, random.randint(0, 5), val_mult=2.5)
        
        # Antony: 8 orders, recent, expensive
        if antony:
            for i in range(8):
                create_order(antony, random.randint(0, 7), val_mult=3.0)

        print("Seeding Loyal Regulars (Arjun)...")
        # Arjun: 10 orders, spread out, mid value
        if arjun:
            for i in range(10):
                create_order(arjun, random.randint(5, 30))

        print("Seeding At Risk (Test User)...")
        # Test User: 2 orders, very old
        if test_user:
            for i in range(2):
                create_order(test_user, random.randint(120, 180))

        db.session.commit()
        print("RFM Data Seeded Successfully!")

if __name__ == '__main__':
    seed_rfm()
