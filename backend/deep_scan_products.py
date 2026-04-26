import sqlite3
import os
import json

# Check all possible DB files for products with user-uploaded images
dbs = [
    'instance/app.db',
    'instance/ecommerce.db', 
    'ecommerce.db',
    'app.db',
    'ecommerce_dev.db',
    'test_ecommerce.db',
]

for db_path in dbs:
    if not os.path.exists(db_path):
        continue
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        # Check if product table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product'")
        if not cursor.fetchone():
            print(f"  {db_path}: No product table")
            conn.close()
            continue
        
        cursor.execute("SELECT * FROM product")
        rows = cursor.fetchall()
        if rows:
            print(f"\n=== {db_path}: Found {len(rows)} products ===")
            cols = [desc[0] for desc in cursor.description]
            print(f"  Columns: {cols}")
            for row in rows:
                d = dict(row)
                print(f"  ID={d.get('id')}, Name={d.get('name')}, Cat={d.get('category')}, Sub={d.get('sub_category')}, Price={d.get('price')}, Brand={d.get('brand')}, Image={d.get('image_url')}")
        else:
            print(f"  {db_path}: product table is empty")
        conn.close()
    except Exception as e:
        print(f"  Error with {db_path}: {e}")
