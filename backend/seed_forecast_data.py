import os
import sys
from datetime import datetime, timedelta
import random

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app import create_app, db
from app.models import User, Order, OrderItem, Product

def seed_fresh_forecast_data():
    app = create_app()
    with app.app_context():
        print("🌱 Seeding fresh transactions for Inventory Forecast...")
        
        # 1. Get some products
        products = Product.query.filter(Product.stock > 10).limit(10).all()
        if not products:
            print("❌ No products with stock found to seed.")
            return

        # 2. Get some users
        users = User.query.filter(User.role == 'customer').all()
        if not users:
            print("❌ No customers found to seed.")
            return

        # 3. Create ~60 orders over the last 7 days
        count = 0
        now = datetime.utcnow()
        
        for i in range(60):
            user = random.choice(users)
            # Random date within last 7 days
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            order_date = now - timedelta(days=days_ago, hours=hours_ago)
            
            new_order = Order(
                user_id=user.id,
                total_amount=0,
                status='delivered',
                timestamp=order_date,
                payment_status='paid'
            )
            
            # Select 1-3 random products for this order
            order_products = random.sample(products, random.randint(1, 3))
            order_total = 0
            
            db.session.add(new_order)
            db.session.flush() # Get order ID
            
            for p in order_products:
                qty = random.randint(1, 4)
                price = p.price
                subtotal = qty * price
                
                oi = OrderItem(
                    order_id=new_order.id,
                    product_id=p.id,
                    quantity=qty,
                    price_at_purchase=price
                )
                db.session.add(oi)
                order_total += subtotal
                
                # Update stock slightly to simulate real sales
                p.stock -= qty
            
            new_order.total_amount = order_total
            count += 1
            
        db.session.commit()
        print(f"✅ Successfully seeded {count} recent transactions across {len(products)} products.")

if __name__ == "__main__":
    seed_fresh_forecast_data()
