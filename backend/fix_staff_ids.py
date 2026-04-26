from app import create_app, db
from app.models import User, OfflineSales

app = create_app()
with app.app_context():
    users = {u.username: u.id for u in User.query.all()}
    sales = OfflineSales.query.all()
    updated = 0
    for s in sales:
        if s.staff_name in users:
            correct_id = users[s.staff_name]
            if s.staff_id != correct_id:
                s.staff_id = correct_id
                updated += 1
    
    db.session.commit()
    print(f'Successfully updated {updated} sales records with correct staff IDs.')
