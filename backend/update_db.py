from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_schema():
    with app.app_context():
        try:
            # Check if columns exist
            with db.engine.connect() as conn:
                # is_approved
                try:
                    conn.execute(text("SELECT is_approved FROM user LIMIT 1"))
                except Exception:
                    print("Adding is_approved...")
                    conn.execute(text("ALTER TABLE user ADD COLUMN is_approved BOOLEAN DEFAULT 1"))
                
                # profile_pic
                try:
                    conn.execute(text("SELECT profile_pic FROM user LIMIT 1"))
                except Exception:
                    print("Adding profile_pic...")
                    conn.execute(text("ALTER TABLE user ADD COLUMN profile_pic VARCHAR(256)"))
                
                # bio
                try:
                    conn.execute(text("SELECT bio FROM user LIMIT 1"))
                except Exception:
                    print("Adding bio...")
                    conn.execute(text("ALTER TABLE user ADD COLUMN bio TEXT"))
                
                conn.commit()
                print("Schema update completed.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == '__main__':
    update_schema()
