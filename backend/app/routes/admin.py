from flask import Blueprint, jsonify, request
from app.models import User, Order, OfflineSales
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403
    
    users = User.query.all()
    result = []
    for u in users:
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role,
            'active': u.active,
            'is_approved': u.is_approved,
            'department': u.department
        })
    return jsonify(result), 200

@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    orders = Order.query.order_by(Order.timestamp.desc()).all()
    result = []
    for o in orders:
        result.append({
            'id': o.id,
            'user': o.customer.username,
            'date': o.timestamp.strftime('%Y-%m-%d %H:%M'),
            'total': o.total_amount,
            'status': o.status
        })
    return jsonify(result), 200

@admin_bp.route('/offline', methods=['GET'])
@jwt_required()
def get_offline_sales():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['admin', 'staff']:
        return jsonify({"msg": "Access denied"}), 403

    sales = OfflineSales.query.order_by(OfflineSales.date.desc()).all()
    result = []
    for s in sales:
        # Calculate profit on the fly for admin list
        profit = s.total_amount - (s.quantity * (s.cost_price or 0)) if s.total_amount and s.quantity else 0
        result.append({
            'id': s.id,
            'sale_id': s.sale_id,
            'date': s.date.strftime('%Y-%m-%d'),
            'amount': s.total_amount,
            'profit': profit,
            'staff': s.staff_name or (s.staff_record.username if s.staff_record else 'Unknown'),
            'product': s.product_name,
            'quantity': s.quantity,
            'method': s.payment_method
        })
    return jsonify(result), 200

@admin_bp.route('/staff/pending', methods=['GET'])
@jwt_required()
def get_pending_staff():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    pending_staff = User.query.filter(
        User.role.in_(['staff', 'delivery_agent']),
        User.is_approved == False
    ).all()
    result = []
    for u in pending_staff:
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role
        })
    return jsonify(result), 200

@admin_bp.route('/staff/<int:id>/approve', methods=['POST'])
@jwt_required()
def approve_staff(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    user = User.query.get(id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    if user.role not in ['staff', 'delivery_agent']:
        return jsonify({"msg": "Only staff or delivery agent accounts can be approved here"}), 400
    
    user.is_approved = True
    db.session.commit()
    
    return jsonify({"msg": f"{user.role.replace('_', ' ').title()} {user.username} approved"}), 200

@admin_bp.route('/staff/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_staff_status(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    user = User.query.get_or_404(id)
    if user.role == 'admin':
        return jsonify({"msg": "Cannot disable admin"}), 400
        
    data = request.get_json()
    if 'active' in data:
        user.active = data['active']
        db.session.commit()
        return jsonify({"msg": f"Staff status updated to {user.active}"}), 200
    
    return jsonify({"msg": "No changes"}), 400

@admin_bp.route('/staff/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_staff(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    user = User.query.get_or_404(id)
    if user.role == 'admin':
        return jsonify({"msg": "Cannot delete admin"}), 400
        
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"msg": "Staff member deleted"}), 200
