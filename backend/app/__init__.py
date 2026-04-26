from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

from flask_jwt_extended import JWTManager
from flask_caching import Cache

db = SQLAlchemy()
jwt = JWTManager()
cache = Cache()

def create_app(config_class=Config):
    # Explicitly set static folder to backend/static (one level up from app/)
    app = Flask(__name__, static_folder='../static')
    app.config.from_object(config_class)

    # Cache Configuration
    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300

    db.init_app(app)
    jwt.init_app(app)
    cache.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173", "*"]}}, supports_credentials=True)

    # Register Blueprints
    from app.routes.main import main_bp
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.orders import orders_bp
    from app.routes.support import support_bp
    from app.routes.offline import offline_bp
    from app.routes.analytics import analytics_bp
    from app.routes.admin import admin_bp
    from app.routes.user_routes import user_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(support_bp, url_prefix='/api/support')
    app.register_blueprint(offline_bp, url_prefix='/api/offline')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    app.register_blueprint(user_bp, url_prefix='/api/user')

    from app.routes.upload_routes import upload_bp
    from app.routes.reviews import reviews_bp

    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(reviews_bp)

    def health_check():
        return {'status': 'healthy', 'service': 'smartcart-backend'}

    return app
