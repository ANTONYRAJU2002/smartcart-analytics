from app import create_app, db
from app.models import User, Order, OrderItem, Product, Review
from flask_jwt_extended import decode_token

app = create_app()
with app.app_context():
    # Let's check User 2 (Dona)
    user_id = 2
    product_name = 'NVIDIA RTX 4090'
    product = Product.query.filter(Product.name.contains(product_name)).first()
    
    if not product:
        print(f"Product {product_name} not found")
    else:
        print(f"Found Product: {product.name} (ID: {product.id})")
        
        # Check purchase
        has_purchased = db.session.query(OrderItem).join(Order).filter(
            Order.user_id == user_id,
            OrderItem.product_id == product.id,
            Order.status.in_(['delivered', 'completed'])
        ).first()
        
        print(f"Has purchased: {has_purchased is not None}")
        
        # Check existing review
        existing_review = Review.query.filter_by(user_id=user_id, product_id=product.id).first()
        print(f"Already reviewed: {existing_review is not None}")
        
        # Check if user_id as string makes a difference
        has_purchased_str = db.session.query(OrderItem).join(Order).filter(
            Order.user_id == str(user_id),
            OrderItem.product_id == product.id,
            Order.status.in_(['delivered', 'completed'])
        ).first()
        print(f"Has purchased (string ID): {has_purchased_str is not None}")
        
        existing_review_str = Review.query.filter_by(user_id=str(user_id), product_id=product.id).first()
        print(f"Already reviewed (string ID): {existing_review_str is not None}")
