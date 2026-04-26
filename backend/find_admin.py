import sys
sys.path.append('.')
from app import create_app
from app.models import User
app = create_app()
with app.app_context():
    admin = User.query.filter_by(role='admin').first()
    if admin:
        print(f"ADMIN_USER: {admin.username}")
    else:
        print("No admin found")
