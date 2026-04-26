from app import create_app, db
from app.models import OfflineSales, Product, User
from datetime import datetime, timedelta
import random
import string

app = create_app()

def generate_sale_id():
    date_str = datetime.utcnow().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"OFF-SEED-{date_str}-{random_str}"

def seed_offline_data():
    with app.app_context():
        print("Cleaning up existing seed data...")
        # Optional: delete existing seed data if needed
        
        # Get all approved staff and admins
        all_staff = User.query.filter(User.role.in_(['staff', 'admin']), User.is_approved == True).all()
        
        if not all_staff:
            # Create a dummy staff if none exists
            staff = User(username='StaffOne', email='staff1@smartcart.com', role='staff', is_approved=True)
            staff.set_password('staff123')
            db.session.add(staff)
            db.session.commit()
            all_staff = [staff]
            print(f"Created initial dummy staff: {staff.username}")

        # Get some products
        products = Product.query.limit(10).all()
        if not products:
            print("No products found in database. Please seed products first.")
            return

        methods = ['UPI', 'Cash', 'Card']
        print(f"Seeding offline sales for {len(all_staff)} staff members...")
        
        # Create a variety of sales over the last 30 days
        scanned_count = 0
        for staff in all_staff:
            count_for_this_staff = random.randint(10, 20)
            print(f"  - Seeding {count_for_this_staff} sales for {staff.username}...")
            
            for i in range(count_for_this_staff):
                p = random.choice(products)
                days_ago = random.randint(0, 30)
                sale_date = (datetime.utcnow() - timedelta(days=days_ago)).date()
                qty = random.randint(1, 4)
                
                sale = OfflineSales(
                    sale_id=generate_sale_id(),
                    staff_name=staff.username,
                    staff_unique_id=f"EMP-{staff.id}",
                    product_id=p.id,
                    product_name=p.name,
                    category=p.category or 'Electronics',
                    sub_category=p.sub_category,
                    quantity=qty,
                    price=p.price or 500.0,
                    offline_discount=random.choice([0, 0, 0, 50, 100, 200]),
                    total_amount=0, # Will calculate below
                    payment_method=random.choice(methods),
                    date=sale_date,
                    staff_id=staff.id,
                    customer_name=f"Customer {random.randint(1, 100)}",
                    customer_phone=f"98{random.randint(10000000, 99999999)}"
                )
                sale.total_amount = (sale.price - sale.offline_discount) * sale.quantity
                db.session.add(sale)
                scanned_count += 1
        
        db.session.commit()
        print(f"Successfully seeded {scanned_count} offline sales totaling {len(all_staff)} staff records.")

if __name__ == '__main__':
    seed_offline_data()
