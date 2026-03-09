from app import create_app, db
from app.models import User

app = create_app()
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

with app.app_context():
    try:
        db.create_all()
        print("DB created.")
        u = User(username='test', email='test@test.com')
        db.session.add(u)
        db.session.commit()
        print(f"User created: {u.id}")
    except Exception as e:
        print(f"Error: {e}")
