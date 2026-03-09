from app import create_app, db
from app.models import User
import sys

app = create_app()
with app.app_context():
    email = 'staff@smartcart.com'
    password = 'staff'
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        print(f"User {email} not found! Creating...")
        user = User(username='staff_member', email=email, role='staff', is_approved=True)
        db.session.add(user)
    else:
        print(f"User {email} found. ID: {user.id}, Role: {user.role}, Approved: {user.is_approved}")
        
    print(f"Setting password to: '{password}'")
    user.set_password(password)
    user.is_approved = True
    db.session.commit()
    
    # Verify
    user = User.query.filter_by(email=email).first()
    is_valid = user.check_password(password)
    print(f"Password check for '{password}': {is_valid}")
    
    if is_valid:
        print("SUCCESS: Login should work now.")
    else:
        print("FAILURE: Password check failed after set.")
