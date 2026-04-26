import sys
import os
sys.path.append(os.getcwd())

from app import create_app, db
from app.models import Product

app = create_app()
with app.app_context():
    products = Product.query.all()
    for p in products:
        if "keyboard" in (p.name or "").lower() or "keyboard" in (p.sub_category or "").lower():
            print(f"Name: {p.name} | Category: {p.category} | Sub-Category: {p.sub_category}")
