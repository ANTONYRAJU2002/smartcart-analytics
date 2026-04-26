from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='staff01@gmail.com').first()
    if user:
        user.role = 'admin'
        user.is_approved = True
        db.session.commit()
        print(f"User {user.email} elevated to admin.")
    else:
        # Create a default admin if not found
        admin = User(username='admin', email='admin@smartcart.com', role='admin', is_approved=True)
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Default admin created: admin@smartcart.com / admin123")
