import os
import sys

# Ensure current directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from app import create_app, db
from app.models import User, Address

def check_data():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print(f"--- USER & ADDRESS DIAGNOSTIC ---")
        print(f"Total Users: {len(users)}")
        for user in users:
            addrs = Address.query.filter_by(user_id=user.id).all()
            print(f"User: {user.username} (ID: {user.id}) | Role: {user.role} | Addresses: {len(addrs)}")
            for a in addrs:
                print(f"  - {a.street}, {a.city} (ID: {a.id})")
        print(f"---------------------------------")

if __name__ == "__main__":
    check_data()
