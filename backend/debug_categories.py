from app import create_app, db
from app.models import Category

app = create_app()
with app.app_context():
    # List existing
    cats = Category.query.all()
    print(f"Existing Categories: {[c.name for c in cats]}")
    
    # Try adding
    test_name = "Debug Category"
    if not Category.query.filter_by(name=test_name).first():
        print(f"Adding '{test_name}'...")
        c = Category(name=test_name)
        db.session.add(c)
        db.session.commit()
        print("Scuccessfully added.")
    else:
        print(f"'{test_name}' already exists.")
        
    # Verify
    cats = Category.query.all()
    print(f"Categories after add: {[c.name for c in cats]}")
