from app import create_app, db
from app.models import User, Address

def add_default_address():
    app = create_app()
    with app.app_context():
        # Let's add it for 'admin' and any other user found
        users = User.query.all()
        for user in users:
            existing = Address.query.filter_by(user_id=user.id).first()
            if not existing:
                new_addr = Address(
                    user_id=user.id,
                    street="123 Tech Avenue",
                    city="Silicon Valley",
                    state="California",
                    zip_code="94025",
                    country="USA",
                    is_default=True
                )
                db.session.add(new_addr)
                print(f"Added address for {user.username}")
        db.session.commit()
        print("Done.")

if __name__ == "__main__":
    add_default_address()
