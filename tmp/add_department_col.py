import sqlite3
import os

db_path = r'c:\Users\anton\OneDrive\Desktop\smart\data\smartcart.db'
print(f"Opening database at {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE user ADD COLUMN department VARCHAR(64);")
    print("Column 'department' added to 'user' successfully.")
except sqlite3.OperationalError as e:
    print(f"OperationalError: {e}")

conn.commit()
conn.close()
