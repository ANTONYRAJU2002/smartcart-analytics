from app import create_app, db
from app.models import User

app = create_app()

def create_admin():
    with app.app_context():
        username = "antony"
        email = "antony@gmail.com"
        password = "1234"
        
        # Check if exists
        user = User.query.filter((User.username == username) | (User.email == email)).first()
        if user:
            print(f"User {username} or {email} already exists. Updating role/password...")
            user.role = 'admin'
            user.is_approved = True
            user.set_password(password)
        else:
            print(f"Creating new admin user {username}...")
            user = User(username=username, email=email, role='admin', is_approved=True)
            user.set_password(password)
            db.session.add(user)
        
        db.session.commit()
        print(f"Admin user '{username}' created/updated successfully.")

if __name__ == '__main__':
    create_admin()
