import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'smartcart.db')

def upgrade_db():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    print(f"Migrating database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE review ADD COLUMN image_url VARCHAR(500);")
        print("Successfully added image_url column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("image_url column already exists.")
        else:
            print(f"Error adding image_url: {e}")

    try:
        cursor.execute("ALTER TABLE review ADD COLUMN admin_comment TEXT;")
        print("Successfully added admin_comment column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("admin_comment column already exists.")
        else:
            print(f"Error adding admin_comment: {e}")

    conn.commit()
    conn.close()
    print("Migration finished for smartcart.db.")

if __name__ == '__main__':
    upgrade_db()
