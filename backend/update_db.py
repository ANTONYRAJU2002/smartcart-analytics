from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_schema():
    with app.app_context():
        try:
            # Check if column exists
            with db.engine.connect() as conn:
                try:
                    conn.execute(text("SELECT is_approved FROM user LIMIT 1"))
                    print("Column 'is_approved' already exists.")
                except Exception:
                    print("Column 'is_approved' not found. Adding it...")
                    conn.execute(text("ALTER TABLE user ADD COLUMN is_approved BOOLEAN DEFAULT 1"))
                    conn.commit()
                    print("Column 'is_approved' added successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    update_schema()
