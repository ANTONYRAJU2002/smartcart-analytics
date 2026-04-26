import csv
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()

def generate_csv(filename, num_records=5000):
    headers = [
        'Sale ID', 'Date', 'Staff Name', 'Staff ID', 'Product Name', 'Product ID',
        'Category', 'Sub Category', 'Quantity', 'Price', 'Offline Discount',
        'Cost Price', 'Payment Method', 'Customer Name', 'Customer Phone', 'Notes'
    ]
    
    products = [
        {"name": "Gaming PC Build", "cat": "Desktops", "sub": "Gaming PC", "price": 85000, "cost": 65000},
        {"name": "Razer BlackWidow", "cat": "Accessories", "sub": "Keyboards", "price": 12000, "cost": 8000},
        {"name": "Logitech MX Master 3", "cat": "Accessories", "sub": "Mice", "price": 8500, "cost": 5000},
        {"name": "ASUS ROG Monitor 27", "cat": "Displays", "sub": "Monitors", "price": 25000, "cost": 18000},
        {"name": "RTX 4070 Ti", "cat": "Components", "sub": "GPU", "price": 75000, "cost": 60000},
        {"name": "Intel Core i7 13700K", "cat": "Components", "sub": "CPU", "price": 35000, "cost": 28000},
        {"name": "Samsung 980 PRO 1TB", "cat": "Components", "sub": "Storage", "price": 8000, "cost": 5500},
        {"name": "Corsair 32GB RAM", "cat": "Components", "sub": "RAM", "price": 9000, "cost": 6000},
        {"name": "NZXT H510 Case", "cat": "Components", "sub": "Cases", "price": 7000, "cost": 4500},
        {"name": "Logitech WebCam C920", "cat": "Accessories", "sub": "Webcams", "price": 6000, "cost": 3500}
    ]
    
    staff = [("Anton", "EMP-001"), ("Jane Doe", "EMP-002"), ("John Smith", "EMP-003")]
    payment_methods = ['Cash', 'Credit Card', 'UPI', 'Debit Card']
    
    start_date = datetime.utcnow() - timedelta(days=5*365) # 5 years ago
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for i in range(num_records):
            # Generate random date
            days_passed = random.randint(0, 5 * 365)
            record_date = start_date + timedelta(days=days_passed)
            
            p = random.choice(products)
            s = random.choice(staff)
            
            qty = random.randint(1, 3)
            discount = random.choice([0, 0, 0, 500, 1000, 1500])
            
            # Sale ID
            date_str = record_date.strftime('%Y%m%d')
            rand_str = ''.join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=4))
            sale_id = f"OFF-{date_str}-{rand_str}-{i}"
            
            # Notes
            notes = fake.sentence() if random.random() > 0.8 else ''
            
            writer.writerow({
                'Sale ID': sale_id,
                'Date': record_date.strftime('%Y-%m-%d'),
                'Staff Name': s[0],
                'Staff ID': s[1],
                'Product Name': p["name"],
                'Product ID': random.randint(1, 20),
                'Category': p["cat"],
                'Sub Category': p["sub"],
                'Quantity': qty,
                'Price': p["price"],
                'Offline Discount': discount,
                'Cost Price': p["cost"],
                'Payment Method': random.choice(payment_methods),
                'Customer Name': fake.name() if random.random() > 0.3 else 'Walk-in',
                'Customer Phone': fake.phone_number() if random.random() > 0.5 else '',
                'Notes': notes
            })

if __name__ == '__main__':
    generate_csv(r'c:\Users\anton\OneDrive\Desktop\smart\Historical_Sales_Data_5_Years.csv', 5000)
    print("CSV generated successfully!")
