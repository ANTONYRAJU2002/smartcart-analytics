"""Diagnostic: check for Alex users and their OfflineSales records."""
from app import create_app, db
from app.models import User, OfflineSales

app = create_app()

with app.app_context():
    print("=== All Users in DB ===")
    users = User.query.all()
    for u in users:
        print(f"  ID={u.id}  username='{u.username}'  role={u.role}  email='{u.email}'")

    print("\n=== All distinct staff_name values in OfflineSales ===")
    names = db.session.query(OfflineSales.staff_name, db.func.count(OfflineSales.id)).group_by(OfflineSales.staff_name).all()
    for name, cnt in names:
        print(f"  staff_name='{name}'  sales_count={cnt}")

    print("\n=== Alex-related User records ===")
    alex_users = User.query.filter(User.username.ilike('%alex%')).all()
    for u in alex_users:
        sale_cnt = OfflineSales.query.filter_by(staff_id=u.id).count()
        sale_by_name = OfflineSales.query.filter_by(staff_name=u.username).count()
        print(f"  ID={u.id}  username='{u.username}'  role={u.role}")
        print(f"    -> Sales by staff_id={u.id}: {sale_cnt}")
        print(f"    -> Sales by staff_name='{u.username}': {sale_by_name}")
