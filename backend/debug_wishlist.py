
from app import create_app, db
from app.models import Wishlist, Product, User

app = create_app()
with app.app_context():
    # Let's find User ID 2 since I saw items there earlier
    user_id = 2
    items = Wishlist.query.filter_by(user_id=user_id).all()
    print(f"DEBUG: Found {len(items)} items for user {user_id}")
    for i in items:
        p = i.product
        if p:
            print(f"  Item Product Found: {p.id} - {p.name}")
        else:
            print(f"  Item Product MISSING for ID {i.product_id}")
