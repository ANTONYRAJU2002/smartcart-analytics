from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_schema():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                # Add sub_category
                try:
                    conn.execute(text("SELECT sub_category FROM offline_sales LIMIT 1"))
                    print("Column 'sub_category' already exists.")
                except Exception:
                    print("Adding category column...")
                    # Note: We already have 'category' but user might have deleted it in a previous step or it might be missing in some DBs
                    try:
                        conn.execute(text("SELECT category FROM offline_sales LIMIT 1"))
                    except Exception:
                        conn.execute(text("ALTER TABLE offline_sales ADD COLUMN category VARCHAR(64)"))
                    
                    print("Adding sub_category column...")
                    conn.execute(text("ALTER TABLE offline_sales ADD COLUMN sub_category VARCHAR(64)"))
                    conn.commit()
                    print("Column 'sub_category' added successfully.")

                # Add offline_discount
                try:
                    conn.execute(text("SELECT offline_discount FROM offline_sales LIMIT 1"))
                    print("Column 'offline_discount' already exists.")
                except Exception:
                    print("Adding offline_discount column...")
                    conn.execute(text("ALTER TABLE offline_sales ADD COLUMN offline_discount FLOAT DEFAULT 0"))
                    conn.commit()
                    print("Column 'offline_discount' added successfully.")
                    
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    update_schema()
