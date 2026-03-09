import random
from datetime import datetime, timedelta
from app import create_app, db
from app.models import User, Product, Order, OrderItem, OfflineSales
from faker import Faker

fake = Faker()
app = create_app()

def generate_data(num_users=200, num_orders=1500, num_offline_days=365):
    with app.app_context():
        print("Starting data generation...")
        
        # 1. Create Products (if not enough)
        categories = [
            'Laptops', 
            'Desktop PCs', 
            'Monitors', 
            'Keyboards & Mouse', 
            'Computer Components', 
            'Storage Devices', 
            'Networking Devices', 
            'Computer Accessories'
        ]
        products = Product.query.all()
        if len(products) < 20:
            print("Creating products...")
            from app.models import ProductImage
            for _ in range(40):
                # Price in INR
                price = round(random.uniform(2000.0, 250000.0), 2)
                cat = random.choice(categories)
                p = Product(
                    name=fake.catch_phrase(),
                    category=cat,
                    price=price,
                    cost_price=round(price * random.uniform(0.6, 0.8), 2), 
                    stock=random.randint(50, 500),
                    image_url=f"https://placehold.co/300x300/1e293b/white?text={cat}"
                )
                db.session.add(p)
                db.session.commit()
                
                # Add extra images
                for i in range(random.randint(2, 4)):
                     img = ProductImage(
                         product_id=p.id, 
                         image_url=f"https://placehold.co/300x300/334155/white?text={cat}+{i+1}"
                     )
                     db.session.add(img)
            db.session.commit()
            products = Product.query.all()

        # 2. Create Users
        print(f"Creating {num_users} users...")
        users = []
        for _ in range(num_users):
            u = User(
                username=fake.user_name(), 
                email=fake.email(),
                role='customer'
            )
            u.set_password('password')
            db.session.add(u)
            users.append(u)
        db.session.commit()
        users = User.query.filter_by(role='customer').all()

        # 3. Generate Online Orders
        print(f"Generating {num_orders} online orders over 365 days...")
        start_date = datetime.utcnow() - timedelta(days=365)
        
        # Helper for associations
        laptop_prods = [p for p in products if p.category == 'Laptops']
        accessory_prods = [p for p in products if p.category == 'Computer Accessories']

        for _ in range(num_orders):
            user = random.choice(users)
            
            # Weighted date generation (Seasonal trend: Oct-Dec is 2x more likely)
            while True:
                order_date = fake.date_time_between(start_date=start_date, end_date='now')
                if order_date.month >= 10: # Q4
                    if random.random() > 0.2: # High probability
                        break
                else:
                    if random.random() > 0.5: # Lower probability
                        break

            order = Order(
                user_id=user.id,
                timestamp=order_date,
                status='completed'
            )
            db.session.add(order)
            db.session.commit()
            
            # Add Items
            total_amount = 0
            num_items = random.randint(1, 4)
            
            # Association Logic: 20% chance of Laptop + Accessory combo
            if random.random() < 0.20 and laptop_prods and accessory_prods:
                selected_products = [random.choice(laptop_prods), random.choice(accessory_prods)]
                # Fill remaining slots
                if num_items > 2:
                    remaining = random.sample(products, num_items - 2)
                    selected_products.extend(remaining)
            else:
                selected_products = random.sample(products, num_items)
            
            for prod in selected_products:
                qty = random.randint(1, 2)
                price = prod.price
                item = OrderItem(
                    order_id=order.id,
                    product_id=prod.id,
                    quantity=qty,
                    price_at_purchase=price
                )
                db.session.add(item)
                total_amount += (price * qty)
            
            order.total_amount = total_amount
        
        db.session.commit()

        # 4. Generate Offline Sales
        print(f"Generating {num_offline_days} days of offline sales...")
        staff = User.query.filter_by(role='staff').first()
        if not staff:
             staff = User(username='staff_gen', email='staff_gen@test.com', role='staff')
             staff.set_password('staff123')
             db.session.add(staff)
             db.session.commit()

        for i in range(num_offline_days):
            date_entry = datetime.utcnow().date() - timedelta(days=i)
            
            # Seasonal Trend for Offline Sales
            base_sales = random.uniform(5000, 20000)
            multiplier = 1.8 if date_entry.month >= 10 else 1.0 # Q4 Boost
            
            sales = round(base_sales * multiplier, 2)
            profit = round(sales * random.uniform(0.15, 0.40), 2)
            
            entry = OfflineSales(
                date=date_entry,
                total_sales=sales,
                total_profit=profit,
                staff_id=staff.id
            )
            db.session.add(entry)
        
        db.session.commit()
        print("Data generation complete!")

if __name__ == '__main__':
    # Need to install Faker first: pip install faker
    generate_data()
