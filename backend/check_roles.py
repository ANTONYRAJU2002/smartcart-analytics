from app import create_app, db
from app.models import OfflineSales, User
app = create_app()
with app.app_context():
    users = User.query.all()
    print("USER ROLES:")
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}")
    
    first_sale = OfflineSales.query.first()
    if first_sale:
        print(f"\nSALE SAMPLE:")
        print(f"ID: {first_sale.id}, StaffID: {first_sale.staff_id}, Amount: {first_sale.total_amount}, Date: {first_sale.date} (type: {type(first_sale.date)})")
