import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'smartcart.db')

def update_db():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Add is_build_header
        cursor.execute("ALTER TABLE order_item ADD COLUMN is_build_header BOOLEAN DEFAULT 0")
        print("Altared table order_item: added is_build_header")
    except sqlite3.OperationalError:
        print("Column is_build_header already exists")

    try:
        # Add build_id
        cursor.execute("ALTER TABLE order_item ADD COLUMN build_id VARCHAR(64)")
        print("Altared table order_item: added build_id")
    except sqlite3.OperationalError:
        print("Column build_id already exists")

    try:
        # Add build_metadata
        cursor.execute("ALTER TABLE order_item ADD COLUMN build_metadata JSON")
        print("Altared table order_item: added build_metadata")
    except sqlite3.OperationalError:
        print("Column build_metadata already exists")

    conn.commit()
    conn.close()
    print("Database updated successfully")

if __name__ == "__main__":
    update_db()
