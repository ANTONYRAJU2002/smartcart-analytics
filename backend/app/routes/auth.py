from flask import Blueprint, jsonify, request
from app import db
from app.models import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)
ALLOWED_ROLES = {'customer', 'staff', 'delivery_agent', 'admin'}
APPROVAL_REQUIRED_ROLES = {'staff', 'delivery_agent'}

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'customer') # Default to customer
    if role not in ALLOWED_ROLES:
        return jsonify({"msg": "Invalid role selected"}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    is_approved = role not in APPROVAL_REQUIRED_ROLES

    new_user = User(username=username, email=email, role=role, is_approved=is_approved)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter((User.username == username) | (User.email == username)).first()
    if user and user.check_password(password):
        if user.role in APPROVAL_REQUIRED_ROLES and not user.is_approved:
            return jsonify({"msg": "Account pending approval"}), 403
            
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, role=user.role, username=user.username), 200

    return jsonify({"msg": "Bad username or password"}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    return jsonify(id=user.id, username=user.username, role=user.role), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Calculate stats safely (guard against None values)
    total_orders = user.orders.count()
    total_spent = sum((order.total_amount or 0) for order in user.orders)
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "phone_number": user.phone_number,
        "profile_pic": user.profile_pic,
        "bio": user.bio,
        "total_orders": total_orders,
        "total_spent": total_spent
    }), 200

@auth_bp.route('/profile', methods=['PATCH', 'PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    data = request.get_json()
    if 'phone_number' in data:
        user.phone_number = data['phone_number']
    if 'username' in data:
        # Check if already exists
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != user.id:
            return jsonify({"msg": "Username already taken"}), 400
        user.username = data['username']
    if 'email' in data:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user.id:
            return jsonify({"msg": "Email already taken"}), 400
        user.email = data['email']
    if 'profile_pic' in data:
        user.profile_pic = data['profile_pic']
    if 'bio' in data:
        user.bio = data['bio']
        
    db.session.commit()
    return jsonify({"msg": "Profile updated successfully"}), 200
