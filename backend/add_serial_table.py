import sqlite3
import json

def add_columns():
    conn = sqlite3.connect('instance/smartcart.db')
    cursor = conn.cursor()
    
    try:
        # Add column to Product if it doesn't exist
        print("Checking Product table...")
        cursor.execute("PRAGMA table_info(product)")
        columns = [info[1] for info in cursor.fetchall()]
        if 'serial_numbers' not in columns:
            print("Adding serial_numbers to Product...")
            cursor.execute("ALTER TABLE product ADD COLUMN serial_numbers JSON")
            
            # Initialize existing products with empty JSON arrays to avoid null errors later
            empty_json = json.dumps([])
            cursor.execute("UPDATE product SET serial_numbers = ?", (empty_json,))
        else:
            print("serial_numbers already in Product.")
            
        # Add column to OrderItem if it doesn't exist
        print("Checking OrderItem table...")
        cursor.execute("PRAGMA table_info(order_item)")
        columns = [info[1] for info in cursor.fetchall()]
        if 'assigned_serial' not in columns:
            print("Adding assigned_serial to OrderItem...")
            cursor.execute("ALTER TABLE order_item ADD COLUMN assigned_serial VARCHAR(100)")
        else:
            print("assigned_serial already in OrderItem.")
            
        conn.commit()
        print("Successfully updated database schema!")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    add_columns()
