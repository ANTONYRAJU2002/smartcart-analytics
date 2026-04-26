import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'smartcart.db')

def update_order_67():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Dona's real info
        correct_address = "kaduthuruthy near hospital, kottyam, kerala 686604, india"
        correct_phone = "8078151530"
        
        # Check if Order #67 exists
        cursor.execute("SELECT id FROM 'order' WHERE id = 67")
        if cursor.fetchone():
            cursor.execute("UPDATE 'order' SET shipping_address = ?, phone_number = ? WHERE id = 67", (correct_address, correct_phone))
            print(f"Successfully updated Order #67 with address: {correct_address} and phone: {correct_phone}")
        else:
            print("Order #67 not found.")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_order_67()
