from app import create_app, db
from app.models import Order, User, OrderItem

app = create_app()
with app.app_context():
    delivered_orders = Order.query.filter_by(status='delivered').all()
    if not delivered_orders:
        print("No delivered orders found. Finding any order to mark as delivered.")
        any_order = Order.query.first()
        if any_order:
            any_order.status = 'delivered'
            db.session.commit()
            print(f"Marked Order #{any_order.id} for {any_order.customer.username} as delivered.")
            delivered_orders = [any_order]
    
    for o in delivered_orders:
        for item in o.items:
            print(f"User: {o.customer.username}, ProductID: {item.product_id}, ProductName: {item.product.name}")
