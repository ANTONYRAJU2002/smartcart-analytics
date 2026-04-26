from app import create_app, db
from app.models import User
import requests
from flask_jwt_extended import create_access_token

app = create_app()
with app.app_context():
    u = User.query.filter_by(role='admin').first()
    if not u:
        print("No admin user found")
        exit(1)
    
    token = create_access_token(identity=str(u.id))
    print(f"Token: {token[:20]}...")
    
    url = "http://127.0.0.1:5000/api/offline/leaderboard"
    params = {'month': '4', 'year': '2026'}
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        r = requests.get(url, params=params, headers=headers)
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.text[:500]}")
    except Exception as e:
        print(f"Request failed: {e}")
