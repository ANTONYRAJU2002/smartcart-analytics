from app import create_app, db
from app.models import OfflineSales, User, StaffAlert, Product
from datetime import datetime, timedelta
import random

def seed_data():
    app = create_app()
    with app.app_context():
        print("Starting seeding process...")
        
        # 1. Get a staff member to assign sales to
        staff = User.query.filter_by(role='staff').first() or User.query.filter_by(role='admin').first()
        if not staff:
            print("No staff/admin user found. Please register first.")
            return

        # 2. Get some products to reference
        products = Product.query.limit(5).all()
        if not products:
            print("No products found in DB. Seeding Generic ones.")
            # We skip creating products to avoid messing up the main catalog, 
            # we'll just use string names if needed.
            p_list = [
                {"name": "ASUS ROG Strix G16", "cat": "Laptops", "price": 125000},
                {"name": "Logitech MX Master 3", "cat": "Peripherals", "price": 8500},
                {"name": "Samsung 980 PRO 1TB", "cat": "Storage", "price": 7000},
                {"name": "Dell Latitude 5440", "cat": "Laptops", "price": 95000},
                {"name": "Keychron K2 V2", "cat": "Peripherals", "price": 9000}
            ]
        else:
            p_list = [{"name": p.name, "cat": p.category, "price": p.price, "id": p.id} for p in products]

        # 3. Create 15 Offline sales
        print(f"Assigning sales to staff: {staff.username}")
        
        methods = ['UPI', 'Cash', 'Card', 'Finance']
        categories = ['Laptops', 'Peripherals', 'Storage', 'Software']
        
        for i in range(15):
            sale_date = datetime.utcnow().date() - timedelta(days=random.randint(0, 14))
            p = random.choice(p_list)
            qty = random.randint(1, 3)
            price = p['price']
            discount = random.choice([0, 100, 200, 500])
            
            sale = OfflineSales(
                sale_id=f"OFF-20260422-{random.randint(1000, 9999)}",
                staff_name=staff.username,
                staff_id=staff.id,
                product_name=p['name'],
                product_id=p.get('id'),
                category=p['cat'] or random.choice(categories),
                quantity=qty,
                price=price,
                offline_discount=discount,
                total_amount=(price - discount) * qty,
                payment_method=random.choice(methods),
                date=sale_date,
                customer_name=f"Customer {i+1}",
                customer_phone=f"98765432{i%10}{i%10}"
            )
            db.session.add(sale)

        # 4. Add a few Staff Alerts for the Admin to see
        for i in range(3):
            p = random.choice(p_list)
            alert = StaffAlert(
                staff_name=staff.username,
                product_name=p['name'],
                product_id=p.get('id'),
                stock_count=random.randint(2, 12),
                is_read=False
            )
            db.session.add(alert)

        db.session.commit()
        print("Success! 15 sales and 3 staff alerts added to database.")

if __name__ == "__main__":
    seed_data()
