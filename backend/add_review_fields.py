import sqlite3
import os

def migrate_db():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_paths = [
        os.path.join(base_dir, 'instance', 'app.db'),
        os.path.join(base_dir, 'instance', 'ecommerce.db'),
        os.path.join(base_dir, 'ecommerce.db'),
        os.path.join(base_dir, 'app.db')
    ]
    
    for db_path in db_paths:
        if os.path.exists(db_path):
            print(f"Migrating database: {db_path}")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            try:
                # Add image_url column
                cursor.execute("ALTER TABLE review ADD COLUMN image_url VARCHAR(256)")
                print("Added 'image_url' column to review table.")
            except sqlite3.OperationalError as e:
                # Ignore error if column already exists
                print(f"Skipping 'image_url': {e}")
                
            try:
                # Add admin_comment column
                cursor.execute("ALTER TABLE review ADD COLUMN admin_comment TEXT")
                print("Added 'admin_comment' column to review table.")
            except sqlite3.OperationalError as e:
                # Ignore error if column already exists
                print(f"Skipping 'admin_comment': {e}")
                
            conn.commit()
            conn.close()
            print("Migration successful.")
            print("-" * 20)

if __name__ == '__main__':
    migrate_db()
