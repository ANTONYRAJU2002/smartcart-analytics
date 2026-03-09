from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_schema_admin():
    with app.app_context():
        try:
            # Create new tables (like Category)
            db.create_all()
            print("Created new tables (if any).")

            with db.engine.connect() as conn:
                # 1. Update User table
                try:
                    conn.execute(text("SELECT active FROM user LIMIT 1"))
                    print("Column 'active' already exists in 'user'.")
                except Exception:
                    print("Adding 'active' column to 'user'...")
                    conn.execute(text("ALTER TABLE user ADD COLUMN active BOOLEAN DEFAULT 1"))

                # 2. Update Order table
                try:
                    conn.execute(text("SELECT payment_status FROM \"order\" LIMIT 1")) # Quote "order" as it's a keyword
                    print("Column 'payment_status' already exists in 'order'.")
                except Exception as e:
                    print("Adding 'payment_status' column to 'order'...")
                    try:
                        conn.execute(text("ALTER TABLE \"order\" ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'"))
                    except Exception as e:
                        print(f"Failed to add payment_status: {e}")

                try:
                    conn.execute(text("SELECT tracking_number FROM \"order\" LIMIT 1"))
                    print("Column 'tracking_number' already exists in 'order'.")
                except Exception:
                    print("Adding 'tracking_number' column to 'order'...")
                    try:
                        conn.execute(text("ALTER TABLE \"order\" ADD COLUMN tracking_number VARCHAR(100)"))
                    except Exception as e:
                        print(f"Failed to add tracking_number: {e}")
                
                conn.commit()
                print("Schema update completed.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    update_schema_admin()
