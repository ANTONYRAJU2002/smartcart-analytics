from app import create_app
from app.models import User, Order, OfflineSales
from sqlalchemy import func

app = create_app()
with app.app_context():
    print("Checking specific users:")
    users = User.query.all()
    for u in users:
        if any(name in u.username.lower() for name in ['staff', 'test', 'buyer']):
            print(f"Username: {u.username}, Role: {u.role}")
    
    print("\nChecking top customers from Order table (with current filter):")
    top_customers = User.query.join(Order).filter(User.role == 'customer').group_by(User.id).limit(5).all()
    for u in top_customers:
        print(f"Top Customer (Online): {u.username}, Role: {u.role}")

    print("\nChecking if OfflineSales has these names:")
    offline_names = [row[0] for row in OfflineSales.query.with_entities(OfflineSales.customer_name).distinct().all() if row[0]]
    for name in offline_names:
        if any(keyword in name.lower() for keyword in ['staff', 'test', 'buyer']):
            print(f"Offline Customer Name: {name}")
