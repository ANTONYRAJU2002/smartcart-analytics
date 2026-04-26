import sqlite3
import os

db_path = r'c:\Users\anton\OneDrive\Desktop\smart\data\smartcart.db'
print(f"Opening database at {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check table name for Order
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]
print(f"Tables: {tables}")

target_table = 'order' if 'order' in tables else 'Order'
if target_table not in tables:
    print("Could not find order table!")
else:
    try:
        cursor.execute(f"ALTER TABLE '{target_table}' ADD COLUMN history JSON;")
        print(f"Column 'history' added to '{target_table}' successfully.")
    except sqlite3.OperationalError as e:
        print(f"OperationalError: {e}")

conn.commit()
conn.close()
