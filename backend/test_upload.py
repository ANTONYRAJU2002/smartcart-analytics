import requests
import os

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

# 2. Create Dummy Image
dummy_filename = "test_image.txt"
with open(dummy_filename, 'w') as f:
    f.write("This is a test image content.")

# 3. Upload File
try:
    files = {'files[]': (dummy_filename, open(dummy_filename, 'rb'), 'text/plain')}
    # Note: Our backend checks extension, so we need to fake a .jpg name or allow .txt for test
    # Let's fake .jpg name but send text content for simplicity
    with open(dummy_filename, 'rb') as f_obj:
        files = {'files[]': ('test_image.jpg', f_obj, 'image/jpeg')}
        resp = requests.post(f'{BASE_URL}/upload/', files=files, headers=headers)

    print(f"POST /upload: {resp.status_code}")
    print(resp.json())
    
    if resp.status_code == 201:
        print("SUCCESS: File uploaded.")
    else:
        print("FAILURE: Upload failed.")
except Exception as e:
    print(f"Upload Exception: {e}")
finally:
    if os.path.exists(dummy_filename):
        os.remove(dummy_filename)
