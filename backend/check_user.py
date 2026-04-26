import sqlite3
import os

db_path = 'smartcart.db'
if not os.path.exists(db_path):
    print("DB not found in root, checking data/...")
    db_path = os.path.join('data', 'smartcart.db')

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, is_approved FROM user WHERE username='dona'")
    row = cursor.fetchone()
    if row:
        print(f"User found: ID={row[0]}, Name={row[1]}, Role={row[2]}, Approved={row[3]}")
    else:
        print("User 'dona' not found in database.")
    
    cursor.execute("SELECT count(*) FROM 'order'")
    print(f"Total orders: {cursor.fetchone()[0]}")
    
    conn.close()
else:
    print("Database not found.")
