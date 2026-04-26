from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    admin = User.query.filter_by(email='admin@smartcart.com').first()
    if admin:
        admin.set_password('admin123')
        db.session.commit()
        print("Password reset for admin@smartcart.com to admin123")
    else:
        print("Admin user not found")
