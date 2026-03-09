import requests

BASE_URL = 'http://localhost:5000/api'

# 1. Login
try:
    auth_resp = requests.post(f'{BASE_URL}/auth/login', json={'username': 'admin', 'password': 'admin'})
    if auth_resp.status_code != 200:
        print(f"Login Failed: {auth_resp.status_code}")
        exit(1)
    token = auth_resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
except Exception as e:
    print(f"Login Exception: {e}")
    exit(1)

# 2. Add Product with Description
product_data = {
    "name": "Description Test Product",
    "category": "Test",
    "price": 100,
    "stock": 10,
    "description": "This is a detailed description.\nIt has multiple lines.\nVery cool."
}

try:
    resp = requests.post(f'{BASE_URL}/products/', json=product_data, headers=headers)
    print(f"POST /products: {resp.status_code}")
    if resp.status_code != 201:
        print(resp.text)
        exit(1)
except Exception as e:
    print(f"POST Exception: {e}")
    exit(1)

# 3. Get Products and Verify
try:
    # Get all products and find the one we just added
    resp = requests.get(f'{BASE_URL}/products/')
    products = resp.json()
    my_prod = next((p for p in products if p['name'] == "Description Test Product"), None)
    
    if my_prod:
        # Get individual product details to see description
        detail_resp = requests.get(f'{BASE_URL}/products/{my_prod["id"]}')
        detail = detail_resp.json()
        print(f"Retrieved Description: {detail.get('description')}")
        
        if "detailed description" in detail.get('description', ''):
            print("SUCCESS: Description saved and retrieved.")
        else:
            print("FAILURE: Description mismatch.")
    else:
        print("FAILURE: Product not found in list.")

except Exception as e:
    print(f"GET Exception: {e}")
