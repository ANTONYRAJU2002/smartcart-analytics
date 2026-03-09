from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='admin@smartcart.com').first()
    if user:
        user.set_password('admin')
        db.session.commit()
        print("Password reset.")
    else:
        u = User(username='Admin', email='admin@smartcart.com', role='admin', is_approved=True)
        u.set_password('admin')
        db.session.add(u)
        db.session.commit()
        print("User created.")
