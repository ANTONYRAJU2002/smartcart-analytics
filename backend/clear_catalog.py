from app import create_app, db
from app.models import Product, Review, ProductImage, OrderItem, Order, Wishlist, StockNotification, Refund

app = create_app()
with app.app_context():
    print("Clearing catalog data...")
    # Order elements must be deleted in order of dependency
    Review.query.delete()
    Wishlist.query.delete()
    StockNotification.query.delete()
    Refund.query.delete()
    OrderItem.query.delete()
    Order.query.delete()
    ProductImage.query.delete()
    Product.query.delete()
    
    db.session.commit()
    print("All products, reviews, and related data have been cleared.")
