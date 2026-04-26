import requests
res = requests.post("http://127.0.0.1:5000/api/support/bot", json={"message": "Hello?"})
print(res.json())
