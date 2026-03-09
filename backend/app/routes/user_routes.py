from flask import Blueprint, jsonify, request
from app import db
from app.models import Address
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user', __name__)

@user_bp.route('/addresses', methods=['GET'])
@jwt_required()
def get_addresses():
    current_user_id = int(get_jwt_identity())
    addresses = Address.query.filter_by(user_id=current_user_id).all()
    
    result = []
    for addr in addresses:
        result.append({
            'id': addr.id,
            'street': addr.street,
            'city': addr.city,
            'state': addr.state,
            'zip_code': addr.zip_code,
            'country': addr.country,
            'is_default': addr.is_default
        })
    return jsonify(result), 200

@user_bp.route('/addresses', methods=['POST'])
@jwt_required()
def add_address():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # If this is the first address, make it default
    is_first = Address.query.filter_by(user_id=current_user_id).count() == 0
    
    new_addr = Address(
        user_id=current_user_id,
        street=data.get('street'),
        city=data.get('city'),
        state=data.get('state'),
        zip_code=data.get('zip_code'),
        country=data.get('country'),
        is_default=True if is_first else data.get('is_default', False)
    )
    
    if new_addr.is_default and not is_first:
        # Unset other defaults
        Address.query.filter_by(user_id=current_user_id, is_default=True).update({'is_default': False})
        
    db.session.add(new_addr)
    db.session.commit()
    
    return jsonify({"msg": "Address added", "id": new_addr.id}), 201

@user_bp.route('/addresses/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_address(id):
    current_user_id = int(get_jwt_identity())
    addr = Address.query.filter_by(id=id, user_id=current_user_id).first_or_404()
    
    db.session.delete(addr)
    db.session.commit()
    return jsonify({"msg": "Address deleted"}), 200
