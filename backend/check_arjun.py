from app import create_app, db
from app.models import OfflineSales, User
from sqlalchemy import func

app = create_app()

with app.app_context():
    arjun = User.query.filter_by(username='Arjun').first()
    if not arjun:
        print("User Arjun not found")
    else:
        print(f"Arjun ID: {arjun.id}")
        arjun_sales = OfflineSales.query.filter_by(staff_id=arjun.id).all()
        print(f"Total sales count for Arjun: {len(arjun_sales)}")
        
        arjun_revenue = db.session.query(func.sum(OfflineSales.total_amount)).filter_by(staff_id=arjun.id).scalar() or 0
        print(f"Total revenue for Arjun: Rs.{arjun_revenue}")

        pay_methods = db.session.query(OfflineSales.payment_method, func.sum(OfflineSales.total_amount)).filter_by(staff_id=arjun.id).group_by(OfflineSales.payment_method).all()
        print("\nArjun's Revenue by Method:")
        for method, total in pay_methods:
            print(f"{method}: {total}")
