from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_schema():
    with app.app_context():
        try:
            # Check if column exists
            with db.engine.connect() as conn:
                try:
                    conn.execute(text("SELECT stock FROM product LIMIT 1"))
                    print("Column 'stock' already exists.")
                except Exception:
                    print("Column 'stock' not found. Adding it...")
                    conn.execute(text("ALTER TABLE product ADD COLUMN stock INTEGER DEFAULT 0"))
                    conn.commit()
                    print("Column 'stock' added successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    update_schema()
