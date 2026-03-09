from app import create_app
from app.models import User
from flask_jwt_extended import create_access_token

app = create_app()
with app.app_context():
    # Get any Customer
    user_p = User.query.filter_by(role='customer').first()
    token_p = create_access_token(identity=str(user_p.id)) if user_p else None
    
    # Get Admin 'Admin'
    admin = User.query.filter_by(username='Admin').first()
    token_admin = create_access_token(identity=str(admin.id)) if admin else None
    
    print(f"TOKEN_CUSTOMER: {token_p}")
    print(f"TOKEN_ADMIN: {token_admin}")
