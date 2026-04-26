
from app import create_app, db
from app.models import Wishlist, Product, User

app = create_app()
with app.app_context():
    wishlists = Wishlist.query.all()
    print(f"Total Wishlist items: {len(wishlists)}")
    for w in wishlists:
        print(f"User ID: {w.user_id}, Product ID: {w.product_id}")
