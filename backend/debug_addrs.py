import sys
import os
sys.path.append(os.getcwd())
from app import app, db
from app.models import User, Address

with app.app_context():
    users = User.query.all()
    print(f"Total Users: {len(users)}")
    for user in users:
        addrs = Address.query.filter_by(user_id=user.id).all()
        print(f"User: {user.username} (ID: {user.id}) | Role: {user.role} | Addresses: {len(addrs)}")
        for a in addrs:
            print(f"  - {a.street}, {a.city} (ID: {a.id})")
