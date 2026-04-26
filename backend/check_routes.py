import requests

# We need a valid token. Let's try to get one if possible, or just check the endpoint existence.
# But it has @jwt_required(), so a simple GET won't work.
# We'll check if the route is registered by inspecting the app map.

from app import create_app
app = create_app()
for rule in app.url_map.iter_rules():
    print(rule)
