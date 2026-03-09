from app import create_app, db
from app.models import Category

app = create_app()
with app.app_context():
    print("Seeding computer categories...")
    categories = [
        "Laptops",
        "Desktop PCs",
        "Monitors",
        "Keyboards & Mouse",
        "Computer Components",
        "Storage Devices",
        "Networking Devices",
        "Computer Accessories"
    ]
    
    for cat_name in categories:
        if not Category.query.filter_by(name=cat_name).first():
            db.session.add(Category(name=cat_name))
    
    db.session.commit()
    print("Categories seeded.")
