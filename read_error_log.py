try:
    with open('backend_error.log', 'r') as f:
        print(f.read())
except FileNotFoundError:
    print("No error log found.")
