from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    # Check if staff exists
    staff_email = 'staff@smartcart.com'
    user = User.query.filter_by(email=staff_email).first()
    
    if user:
        print(f"Staff user {staff_email} already exists.")
        # Ensure password is correct and approved
        user.set_password('staff')
        user.is_approved = True
        db.session.commit()
        print("Password reset and approved.")
    else:
        # Create new staff
        u = User(username='staff_member', email=staff_email, role='staff', is_approved=True)
        u.set_password('staff')
        db.session.add(u)
        db.session.commit()
        print(f"Staff user {staff_email} created and approved.")
