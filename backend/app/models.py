from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='customer') # 'admin', 'staff', 'delivery_agent', 'customer'
    is_approved = db.Column(db.Boolean, default=True) # Default approved (for customers), staff/delivery_agent need manual
    active = db.Column(db.Boolean, default=True) # For soft delete/disabling
    phone_number = db.Column(db.String(20))
    profile_pic = db.Column(db.String(256)) # URL to profile picture
    bio = db.Column(db.Text) # Staff bio / details
    department = db.Column(db.String(64), default='Operations')

    orders = db.relationship('Order', backref='customer', lazy='dynamic')
    offline_sales = db.relationship('OfflineSales', backref='staff_record', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    subcategories = db.relationship('SubCategory', backref='category', lazy='dynamic', cascade='all, delete-orphan')

class SubCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140))
    category = db.Column(db.String(64)) 
    sub_category = db.Column(db.String(64))
    price = db.Column(db.Float)
    mrp = db.Column(db.Float)
    discount = db.Column(db.Float, default=0)
    cost_price = db.Column(db.Float) # For profit calculation
    stock = db.Column(db.Integer, default=0)
    sku = db.Column(db.String(64), index=True)
    description = db.Column(db.Text) # Product description / About
    image_url = db.Column(db.String(256)) # URL to product image (Primary)
    warranty = db.Column(db.String(100))
    brand = db.Column(db.String(64)) # Brand name
    model_number = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active') # active, draft
    specifications = db.Column(db.JSON) # JSON store for dynamic specs
    variants = db.Column(db.JSON) # JSON store for variations
    colors = db.Column(db.String(200)) # Legacy colors field
    serial_numbers = db.Column(db.JSON) # For tracking unique serials
    images = db.relationship('ProductImage', backref='product', lazy='dynamic')

class ProductImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    image_url = db.Column(db.String(256))

class OfflineSales(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.String(32), unique=True, index=True)
    staff_name = db.Column(db.String(64))
    staff_unique_id = db.Column(db.String(32)) # e.g. EMP001
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=True)
    product_name = db.Column(db.String(140))
    category = db.Column(db.String(64))
    sub_category = db.Column(db.String(64))
    quantity = db.Column(db.Integer)
    price = db.Column(db.Float)
    offline_discount = db.Column(db.Float, default=0)
    cost_price = db.Column(db.Float, nullable=True) # For profit calculation
    total_amount = db.Column(db.Float)
    payment_method = db.Column(db.String(20)) # Cash, UPI, Card
    date = db.Column(db.Date, index=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('user.id')) # Internal user link
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    customer_name = db.Column(db.String(120), nullable=True)
    customer_phone = db.Column(db.String(20), nullable=True)
    notes = db.Column(db.Text, nullable=True)

class Return(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.String(32), index=True) # Linked to offline_sales.sale_id
    product_name = db.Column(db.String(140))
    staff_name = db.Column(db.String(64))
    quantity_returned = db.Column(db.Integer)
    refund_amount = db.Column(db.Float)
    return_reason = db.Column(db.Text)
    return_date = db.Column(db.Date, default=datetime.utcnow().date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    total_amount = db.Column(db.Float)
    status = db.Column(db.String(20), default='pending') # pending, packed, shipped, delivered, cancelled
    payment_status = db.Column(db.String(20), default='pending') # pending, paid, failed
    tracking_number = db.Column(db.String(100), nullable=True)
    shipping_address = db.Column(db.Text)
    phone_number = db.Column(db.String(20), nullable=True) # Added for order tracking
    payment_method = db.Column(db.String(20)) # Card, UPI, COD
    delivery_proof = db.Column(db.JSON) # List of URLs to delivery proof images
    collected_amount = db.Column(db.Float) # For COD validation
    is_cod_received = db.Column(db.Boolean, default=False)
    cod_received_at = db.Column(db.DateTime)
    delivery_attempts = db.Column(db.Integer, default=0)
    failure_reason = db.Column(db.String(100))
    failure_action = db.Column(db.String(50))
    advance_amount = db.Column(db.Float, default=0.0) # 10% paid upfront
    cod_balance = db.Column(db.Float, default=0.0)    # 90% to be collected
    history = db.Column(db.JSON) # List of {status, timestamp, message}
    items = db.relationship('OrderItem', backref='order', lazy='dynamic')

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    quantity = db.Column(db.Integer)
    price_at_purchase = db.Column(db.Float)
    selected_color = db.Column(db.String(50), nullable=True) # For tracking variants
    status = db.Column(db.String(20), default='active') # active, cancelled
    
    # PC Builder Grouping Fields
    is_build_header = db.Column(db.Boolean, default=False)
    build_id = db.Column(db.String(64), nullable=True)
    build_metadata = db.Column(db.JSON, nullable=True) # AI Analysis, Build Name, etc.

    product = db.relationship('Product')

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    rating = db.Column(db.Integer)
    comment = db.Column(db.Text)
    image_url = db.Column(db.String(256))
    admin_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='reviews')
    product = db.relationship('Product', backref='reviews')

class Refund(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending') # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order = db.relationship('Order', backref='refund')
    user = db.relationship('User', backref='refunds')

class SupportTicket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    subject = db.Column(db.String(140))
    status = db.Column(db.String(20), default='open') # open, closed
    admin_unread_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='tickets')
    messages = db.relationship('TicketMessage', backref='ticket', lazy='dynamic')

class TicketMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_ticket.id'))
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id')) # Staff or User
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sender = db.relationship('User')

class Wishlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='wishlist_items')
    product = db.relationship('Product')

class Address(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    street = db.Column(db.String(200))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    country = db.Column(db.String(100))
    is_default = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref='addresses')

class StaffAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_name = db.Column(db.String(64))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    product_name = db.Column(db.String(140))
    stock_count = db.Column(db.Integer)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product')
