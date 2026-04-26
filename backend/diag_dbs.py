import sqlite3
import os

dbs = [
    'smartcart.db',
    'instance/smartcart.db',
    'instance/app.db',
    'instance/ecommerce.db',
    'app.db',
    'ecommerce.db',
    '../data/smartcart.db'
]

for db_path in dbs:
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM product")
            count = cursor.fetchone()[0]
            print(f"DB: {db_path}, Product Count: {count}")
            # Also list first few names to see if they're the new ones or old ones
            cursor.execute("SELECT name FROM product LIMIT 5")
            names = [row[0] for row in cursor.fetchall()]
            print(f"  Samples: {names}")
            conn.close()
        except Exception as e:
            print(f"Error reading {db_path}: {e}")
    else:
        print(f"Path not found: {db_path}")
