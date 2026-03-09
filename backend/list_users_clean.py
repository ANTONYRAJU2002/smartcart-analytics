from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    print("id,username,email,role,is_approved")
    for u in users:
        print(f"{u.id},{u.username},{u.email},{u.role},{u.is_approved}")
