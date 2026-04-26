from app import create_app, db
from app.models import OfflineSales, User
app = create_app()
with app.app_context():
    count = OfflineSales.query.count()
    print(f"Total Offline Sales records: {count}")
    if count > 0:
        first = OfflineSales.query.first()
        print(f"First record staff_id: {first.staff_id}, amount: {first.total_amount}")
        users = User.query.all()
        print(f"Users: {[(u.id, u.username) for u in users]}")
