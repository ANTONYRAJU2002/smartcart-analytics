import sqlite3
import json
import os

db_path = r'c:\Users\anton\OneDrive\Desktop\smart\data\smartcart.db'
if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT id, name, specifications FROM product LIMIT 5')
rows = cursor.fetchall()
for r in rows:
    try:
        specs_json = json.loads(r[2]) if r[2] else None
    except Exception as e:
        specs_json = f"ERROR PARSING JSON: {r[2]}"
    print(f"ID: {r[0]}, Name: {r[1]}")
    print(f"Raw Specs: {r[2]}")
    print(f"Parsed Specs: {json.dumps(specs_json, indent=2) if specs_json else 'None'}\n")
    
conn.close()
