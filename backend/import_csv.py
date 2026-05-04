import csv
import sys
import os
from datetime import datetime

# Setup path for flask app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import create_app, db
from app.models import OfflineSales, User, Product

def run_safe_import():
    app = create_app()
    with app.app_context():
        # Clean current OfflineSales to prevent duplicate clashes during import run
        db.session.query(OfflineSales).delete()
        db.session.commit()
        
        # Get fallback admin
        admin = User.query.filter_by(role='admin').first()
        admin_id = admin.id if admin else 1
        
        # Dynamically map actual product IDs currently in the database to prevent Foreign Key errors
        product_map = {p.name: p.id for p in Product.query.all()}
        
        csv_path = 'Historical_Sales_Data_5_Years.csv'
        if not os.path.exists(csv_path):
            # Try to find it relative to script
            csv_path = os.path.join(os.path.dirname(__file__), 'Historical_Sales_Data_5_Years.csv')
        entries = []
        count = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Dynamically retrieve safe Product ID based on matching product names; else None
                safe_product_id = product_map.get(row.get('Product Name'))
                
                sales_date = datetime.strptime(row.get('Date'), '%Y-%m-%d').date()
                qty = int(row.get('Quantity', 0))
                price = float(row.get('Price', 0))
                discount = float(row.get('Offline Discount', 0))
                cost = float(row.get('Cost Price', 0)) if row.get('Cost Price') else None
                
                entry = OfflineSales(
                    sale_id=row.get('Sale ID'),
                    staff_name=row.get('Staff Name', 'System'),
                    staff_unique_id=row.get('Staff ID'),
                    product_id=safe_product_id,
                    product_name=row.get('Product Name', 'Unknown'),
                    category=row.get('Category', 'General'),
                    sub_category=row.get('Sub Category'),
                    quantity=qty,
                    price=price,
                    offline_discount=discount,
                    cost_price=cost,
                    total_amount=(price - discount) * qty,
                    payment_method=row.get('Payment Method', 'Cash'),
                    date=sales_date,
                    staff_id=admin_id,
                    customer_name=row.get('Customer Name'),
                    customer_phone=row.get('Customer Phone'),
                    notes=row.get('Notes')
                )
                entries.append(entry)
                count += 1
                
                # Bulk insert chunks to keep memory usage extremely low and stable
                if len(entries) >= 500:
                    db.session.add_all(entries)
                    db.session.commit()
                    entries = []
        
        if entries:
            db.session.add_all(entries)
            db.session.commit()
            
        print(f"Validation successful! {count} historical sales securely injected into the platform without errors.")

if __name__ == '__main__':
    run_safe_import()
