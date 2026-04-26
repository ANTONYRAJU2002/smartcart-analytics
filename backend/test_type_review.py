from app import create_app, db
from app.models import User, Order, OrderItem, Product, Review

app = create_app()
with app.app_context():
    # User ID 2 (Dona) as a string, which is how get_jwt_identity() returns it
    user_id_str = '2'
    product_id = 25 # NVIDIA RTX 4090
    
    # Check purchase
    has_purchased = db.session.query(OrderItem).join(Order).filter(
        Order.user_id == user_id_str,
        OrderItem.product_id == product_id,
        Order.status.in_(['delivered', 'completed'])
    ).first()
    
    print(f"Has purchased (string '2' == int 2): {has_purchased is not None}")
    
    # Check with int cast
    has_purchased_int = db.session.query(OrderItem).join(Order).filter(
        Order.user_id == int(user_id_str),
        OrderItem.product_id == product_id,
        Order.status.in_(['delivered', 'completed'])
    ).first()
    print(f"Has purchased (int cast): {has_purchased_int is not None}")
