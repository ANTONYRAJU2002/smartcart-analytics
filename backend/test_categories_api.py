import requests

BASE_URL = 'http://localhost:5000/api/products'

# 1. Login to get token
try:
    auth_resp = requests.post('http://localhost:5000/api/auth/login', json={'username': 'admin', 'password': 'admin'})
    if auth_resp.status_code != 200:
        print(f"Login Failed: {auth_resp.status_code} {auth_resp.text}")
        exit(1)
    token = auth_resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print("Logged in as Admin.")
except Exception as e:
    print(f"Login Exception: {e}")
    exit(1)

# 2. Get Categories
try:
    resp = requests.get(f'{BASE_URL}/categories')
    print(f"GET /categories: {resp.status_code}")
    print(resp.json())
except Exception as e:
    print(f"GET Exception: {e}")

# 3. Add Category
try:
    new_cat = {'name': 'API Test Category'}
    resp = requests.post(f'{BASE_URL}/categories', json=new_cat, headers=headers)
    print(f"POST /categories: {resp.status_code}")
    print(resp.json())
except Exception as e:
    print(f"POST Exception: {e}")
