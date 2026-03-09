import sys
import os

# Set up pathing
sys.path.append(os.getcwd())

from app import create_app, db

def run_debug():
    try:
        flask_app = create_app()
        print("Flask App created successfully")
        
        with flask_app.app_context():
            from app.models import User, Address, Product, Order, OrderItem
            print("Models imported successfully")
            
            user = User.query.filter_by(role='customer').first()
            if not user:
                print("No customer found")
                return
            
            address = Address.query.filter_by(user_id=user.id).first()
            if not address:
                print("No address found for user")
                return
                
            product = Product.query.first()
            if not product:
                print("No product found")
                return
                
            print(f"User ID: {user.id}, Address ID: {address.id}, Product ID: {product.id}")
            
            # Simulate logic
            shipping_str = f"{address.street}, {address.city}, {address.state} {address.zip_code}, {address.country}"
            new_order = Order(user_id=user.id, total_amount=product.price, shipping_address=shipping_str)
            oi = OrderItem(product=product, quantity=1, price_at_purchase=product.price)
            new_order.items.append(oi)
            
            db.session.add(new_order)
            db.session.commit()
            print(f"Order {new_order.id} placed successfully in DB")
            
            # Test profile update
            user.phone_number = "1234567890"
            db.session.commit()
            print("Profile updated successfully in DB")
            
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_debug()
