from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    # Fix Admin Users
    admins = User.query.filter((User.username == 'admin') | (User.email == 'admin@smartcart.com') | (User.role == 'admin')).all()
    for u in admins:
        print(f"Resetting password for Admin: {u.username} (ID: {u.id}) -> 'admin'")
        u.set_password('admin')
        u.is_approved = True
    
    # Fix Staff Users
    staffs = User.query.filter((User.username == 'staff') | (User.email == 'staff@smartcart.com') | (User.role == 'staff')).all()
    for u in staffs:
        print(f"Resetting password for Staff: {u.username} (ID: {u.id}) -> 'staff'")
        u.set_password('staff')
        u.is_approved = True
        
    db.session.commit()
    print("All credentials updated.")
