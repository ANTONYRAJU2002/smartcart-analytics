from app import create_app, db
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Existing tables: {tables}")
    
    if 'product_image' not in tables:
        print("Creating product_image table...")
        db.create_all()
        print("Done.")
    else:
        print("product_image table already exists.")
