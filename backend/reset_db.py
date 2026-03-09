from app import create_app, db
import os

app = create_app()
with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables from scratch...")
    db.create_all()
    print("Database schema updated successfully.")
