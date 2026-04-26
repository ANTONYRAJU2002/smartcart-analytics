from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    staff = User.query.filter_by(role='staff').all()
    print(f"DEBUG: Found {len(staff)} staff members")
    for s in staff:
        print(f"DEBUG: Staff: {s.username} (ID: {s.id})")
