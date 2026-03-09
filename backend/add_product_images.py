from app import create_app, db
from app.models import ProductImage
from sqlalchemy import text

app = create_app()

def update_schema():
    with app.app_context():
        try:
            # Check if table exists
            with db.engine.connect() as conn:
                try:
                    conn.execute(text("SELECT 1 FROM product_image LIMIT 1"))
                    print("Table 'product_image' already exists.")
                except Exception:
                    print("Table 'product_image' not found. Creating it...")
                    # Create the table explicitly using SQLAlchemy metadata
                    db.create_all() 
                    # Note: db.create_all() creates all missing tables. 
                    # Since others exist, it should only create product_image.
                    print("Table 'product_image' created successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    update_schema()
