try:
    with open('backend/backend.log', 'r', encoding='utf-16-le') as f:
        f.seek(0, 2)
        size = f.tell()
        f.seek(max(0, size - 20000))
        print(f.read())
except UnicodeError:
    with open('backend/backend.log', 'r', encoding='utf-8', errors='ignore') as f:
        f.seek(0, 2)
        size = f.tell()
        f.seek(max(0, size - 20000))
        print(f.read())
except Exception as e:
    print(f"Error: {e}")
