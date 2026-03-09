from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_schema():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                # Check if columns exist
                result = conn.execute(text("PRAGMA table_info(product)")).fetchall()
                columns = [row[1] for row in result]
                
                if 'warranty' not in columns:
                    print("Adding 'warranty' column to Product table...")
                    conn.execute(text("ALTER TABLE product ADD COLUMN warranty VARCHAR(100)"))
                else:
                    print("'warranty' column already exists.")
                    
                if 'colors' not in columns:
                    print("Adding 'colors' column to Product table...")
                    conn.execute(text("ALTER TABLE product ADD COLUMN colors VARCHAR(200)"))
                else:
                    print("'colors' column already exists.")
                    
                conn.commit()
                print("Schema update completed successfully.")
        except Exception as e:
            print(f"Error updating schema: {e}")

if __name__ == "__main__":
    update_schema()
