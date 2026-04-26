from app import create_app, db
from app.models import OfflineSales
from sqlalchemy import func

app = create_app()

with app.app_context():
    payment_methods = db.session.query(OfflineSales.payment_method, func.count(OfflineSales.id)).group_by(OfflineSales.payment_method).all()
    print("Payment Methods Distribution:")
    for method, count in payment_methods:
        print(f"{method}: {count}")

    total_by_method = db.session.query(OfflineSales.payment_method, func.sum(OfflineSales.total_amount)).group_by(OfflineSales.payment_method).all()
    print("\nRevenue by Method:")
    for method, total in total_by_method:
        print(f"{method}: {total}")
