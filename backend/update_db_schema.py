import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'smartcart.db')

def add_phone_column():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Add phone_number column to 'order' table
        # We wrap in try-except in case column already exists
        try:
            cursor.execute("ALTER TABLE 'order' ADD COLUMN phone_number TEXT")
            print("Successfully added phone_number column to order table.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("Column phone_number already exists.")
            else:
                raise e
        
        # Patch Order #67
        # First check if it exists
        cursor.execute("SELECT user_id FROM 'order' WHERE id = 67")
        row = cursor.fetchone()
        if row:
            user_id = row[0]
            # Get user info for fallback
            cursor.execute("SELECT username, email, phone_number FROM user WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if user:
                fallback_address = "123 Tech Avenue, Silicon Valley, CA 94025"
                fallback_phone = user[2] or "9961228320"
                cursor.execute("UPDATE 'order' SET shipping_address = ?, phone_number = ? WHERE id = 67", (fallback_address, fallback_phone))
                print(f"Patched Order #67 with address: {fallback_address} and phone: {fallback_phone}")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    add_phone_column()
