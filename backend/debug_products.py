from app import create_app, db
from app.models import Product

app = create_app()
with app.app_context():
    prods = Product.query.all()
    print(f"Total Products: {len(prods)}")
    for p in prods[:5]:
        print(f" - {p.name} (SKU: {p.sku})")
