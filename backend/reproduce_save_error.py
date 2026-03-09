import requests
import json

BASE_URL = 'http://localhost:5000/api'

import time
import socket

def wait_for_server(host='localhost', port=5000, timeout=10):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except (socket.timeout, ConnectionRefusedError):
            time.sleep(1)
    return False

if not wait_for_server():
    print("Server not available.")
    exit(1)

def login():
    try:
        resp = requests.post(f'{BASE_URL}/auth/login', json={'username': 'admin', 'password': 'admin'})
        if resp.status_code == 200:
            return resp.json()['access_token']
        print(f"Login failed: {resp.text}")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_add_product(token, payload, test_name):
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    try:
        resp = requests.post(f'{BASE_URL}/products/', json=payload, headers=headers)
        print(f"Test '{test_name}': Status {resp.status_code}")
        if resp.status_code != 201:
            print(f"Response: {resp.text}")
            if resp.status_code == 500:
                # Try to extract title or exception from HTML
                if "<title>" in resp.text:
                    start = resp.text.find("<title>") + 7
                    end = resp.text.find("</title>")
                    print(f"Error Title: {resp.text[start:end]}")
    except Exception as e:
        print(f"Test '{test_name}' Exception: {e}")

token = login()
if token:
    # 1. Full payload (should work)
    test_add_product(token, {
        "name": "Full Product",
        "category": "Test",
        "price": "100",
        "cost_price": "80",
        "stock": "10",
        "image_url": "",
        "description": "Desc",
        "image_gallery": []
    }, "Full Payload")

    # 2. Empty optional fields (should work with my fix)
    test_add_product(token, {
        "name": "Empty Optionals",
        "category": "Test",
        "price": "100",
        "cost_price": "",
        "stock": "",
        "image_url": "",
        "description": "",
        "image_gallery": []
    }, "Empty Optionals")

    # 3. Missing fields (might crash if I don't use .get properly for everything?)
    # price is data['price'], others are data.get
    test_add_product(token, {
        "name": "Missing Fields",
        "category": "Test",
        "image_gallery": []
        # Missing price
    }, "Missing Price (Should 500 or 400)")
    
    # 4. Invalid types
    test_add_product(token, {
        "name": "Invalid Price",
        "category": "Test",
        "price": "abc",
        "image_gallery": []
    }, "Invalid Price")

    # 5. Image Gallery with None
    test_add_product(token, {
        "name": "Gallery None",
        "category": "Test",
        "price": "100",
        "image_gallery": [None, "http://valid.url"]
    }, "Gallery None")
