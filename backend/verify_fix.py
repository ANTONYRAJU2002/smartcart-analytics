
from app import create_app, db
from app.models import Wishlist, Product, User

app = create_app()
with app.app_context():
    # Simulating the get_wishlist route logic
    user_id = 2
    items = Wishlist.query.filter_by(user_id=user_id).all()
    
    result = []
    for item in items:
        p = item.product
        if not p:
            continue
            
        result.append({
            'id': p.id,
            'name': p.name
        })
    
    print(f"SUCCESS: Fetched {len(result)} valid items out of {len(items)} records.")
    for r in result:
        print(f"  - {r['id']}: {r['name']}")
