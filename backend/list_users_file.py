from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    with open('users.txt', 'w') as f:
        f.write("id,username,email,role,is_approved\n")
        for u in users:
            f.write(f"{u.id},{u.username},{u.email},{u.role},{u.is_approved}\n")
    print("Users written to users.txt")
