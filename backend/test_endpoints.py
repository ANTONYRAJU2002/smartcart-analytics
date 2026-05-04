import requests

BASE_URL = "http://127.0.0.1:5000/api"

def test_login():
    try:
        # Try Admin/admin123
        res = requests.post(f"{BASE_URL}/auth/login", json={"username": "Admin", "password": "admin123"})
        if res.status_code == 200:
            print("Login Successful!")
            token = res.json()['access_token']
            return token
        else:
            print(f"Login Failed: {res.json()}")
            # Try admin/admin123
            res = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
            if res.status_code == 200:
                print("Login Successful (lowercase admin)!")
                token = res.json()['access_token']
                return token
            else:
                print(f"Login Failed (lowercase): {res.json()}")
    except Exception as e:
        print(f"Error: {e}")
    return None

def test_leaderboard(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/offline/leaderboard", headers=headers)
    print(f"Leaderboard Response ({res.status_code}): {res.text[:500]}")

def test_stats(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/offline/stats?global=true", headers=headers)
    print(f"Stats Response ({res.status_code}): {res.text[:500]}")

if __name__ == "__main__":
    token = test_login()
    if token:
        test_leaderboard(token)
        test_stats(token)
