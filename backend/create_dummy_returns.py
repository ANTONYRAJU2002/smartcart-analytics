import os
import random
from datetime import datetime, timedelta
from app import create_app, db
from app.models import OfflineSales, Return, Product, User

app = create_app()

def run():
    with app.app_context():
        # 1. Fetch some offline sales. If less than 10, create them.
        staff = User.query.filter_by(role='staff').first()
        if not staff:
            print("No staff found. Please create a staff user.")
            return

        products = Product.query.limit(5).all()
        if not products:
            print("No products available to create dummy sales.")
            return

        reasons = [
            "Defective item on arrival",
            "Customer changed mind",
            "Wrong product delivered/handed over",
            "Damaged packaging",
            "Not as expected",
            "Color mismatch",
            "Quality issue reported",
            "Size did not fit",
            "Found cheaper alternative",
            "Unwanted gift"
        ]

        sales = OfflineSales.query.order_by(OfflineSales.id.desc()).limit(15).all()
        
        # We need at least 10 sales
        while len(sales) < 10:
            p = random.choice(products)
            q = random.randint(2, 5)
            sale = OfflineSales(
                sale_id=f"OFF-DUMMY-{random.randint(1000, 9999)}",
                staff_name=staff.username,
                staff_unique_id=f"EMP-{staff.id}",
                product_id=p.id,
                product_name=p.name,
                category=p.category,
                quantity=q,
                price=p.price,
                total_amount=p.price * q,
                payment_method="Cash",
                date=datetime.utcnow().date() - timedelta(days=random.randint(1, 30)),
                staff_id=staff.id,
                customer_name="Dummy Customer"
            )
            db.session.add(sale)
            sales.append(sale)
        
        db.session.commit()
        
        print(f"Ensured at least 10 sales exist. Current count: {len(sales)}")

        # 2. Create 10 dummy returns for these sales.
        returns_created = 0
        for i, sale in enumerate(sales[:10]):
            qty_to_return = 1 if sale.quantity <= 1 else random.randint(1, sale.quantity - 1)
            
            # Check if already returned
            existing = Return.query.filter_by(sale_id=sale.sale_id).first()
            if existing:
                continue

            ret = Return(
                sale_id=sale.sale_id,
                product_name=sale.product_name,
                staff_name=staff.username,
                quantity_returned=qty_to_return,
                refund_amount=sale.price * qty_to_return,
                return_reason=reasons[i % len(reasons)],
                return_date=(sale.date + timedelta(days=random.randint(1, 5))) if sale.date else datetime.utcnow().date(),
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 5))
            )
            db.session.add(ret)
            returns_created += 1

        db.session.commit()
        print(f"Successfully created {returns_created} dummy returns.")

if __name__ == "__main__":
    run()
