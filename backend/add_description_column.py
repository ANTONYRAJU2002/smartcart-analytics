from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    with db.engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE product ADD COLUMN description TEXT"))
            conn.commit()
            print("Successfully added 'description' column to product table.")
        except Exception as e:
            print(f"Error (column likely exists): {e}")
