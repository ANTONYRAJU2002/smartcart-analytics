from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    admins = User.query.filter_by(role='admin').all()
    for a in admins:
        print(f"ADMIN: {a.username}, EMAIL: {a.email}")
