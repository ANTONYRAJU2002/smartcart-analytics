from flask import Blueprint, jsonify, request
from app import db
from app.models import SupportTicket, TicketMessage, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

support_bp = Blueprint('support', __name__)

@support_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_ticket():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data.get('inquiry_type') or not data.get('message'):
        return jsonify({"msg": "Inquiry type and Message are required"}), 400

    order_id = data.get('order_id')
    
    if data.get('inquiry_type') in ['Refund Request', 'Complaint'] and not order_id:
        return jsonify({"msg": f"Order ID is required for a {data.get('inquiry_type').lower()}"}), 400

    if order_id:
        from app.models import Order
        order = Order.query.filter_by(id=order_id, user_id=current_user_id).first()
        if not order:
            return jsonify({"msg": "Order not found or does not belong to you."}), 404
        subject = f"{data['inquiry_type']}: Order #{order_id}"
    else:
        subject = f"{data['inquiry_type']}"

    new_ticket = SupportTicket(
        user_id=current_user_id,
        subject=subject
    )
    db.session.add(new_ticket)
    db.session.commit()
    
    initial_msg = TicketMessage(
        ticket_id=new_ticket.id,
        sender_id=current_user_id,
        message=data['message']
    )
    db.session.add(initial_msg)
    db.session.commit()
    
    return jsonify({"msg": "Ticket created", "ticket_id": new_ticket.id}), 201

@support_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_tickets():
    current_user_id = int(get_jwt_identity())
    tickets = SupportTicket.query.filter_by(user_id=current_user_id).order_by(SupportTicket.created_at.desc()).all()
    
    result = []
    for t in tickets:
        result.append({
            'id': t.id,
            'subject': t.subject,
            'status': t.status,
            'admin_unread_count': t.admin_unread_count,
            'created_at': t.created_at
        })
    return jsonify(result), 200

@support_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_tickets():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    from app.models import Refund
    
    result = []
    for t in tickets:
        refund = Refund.query.filter_by(user_id=t.user_id).filter(Refund.reason.contains(f"Order #")).first()
        # Simplistic check: if subject or initial msg contains "Refund Request", look for refund
        is_refund = "Refund Request" in t.subject
        
        result.append({
            'id': t.id,
            'user': t.user.username,
            'subject': t.subject,
            'status': t.status,
            'created_at': t.created_at,
            'is_refund': is_refund
        })
    return jsonify(result), 200

@support_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_ticket_details(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    ticket = SupportTicket.query.get_or_404(id)
    
    # Allow if owner OR admin
    if ticket.user_id != current_user_id and (not current_user or current_user.role != 'admin'):
        return jsonify({"msg": "Access denied"}), 403
        
    # Reset unread count if the ticket owner is viewing it
    if ticket.user_id == current_user_id and ticket.admin_unread_count > 0:
        ticket.admin_unread_count = 0
        db.session.commit()
        
    messages = []
    for m in ticket.messages.order_by(TicketMessage.created_at).all():
        messages.append({
            'id': m.id,
            'sender': m.sender.username,
            'sender_id': m.sender_id,
            'message': m.message,
            'created_at': m.created_at
        })
        
    # Check for associated refund and parse order details for contextual admin rendering
    refund_data = None
    order_data = None
    
    # Extract order ID from subject if formatted like "Type: Order #123"
    import re
    match = re.search(r"Order #(\d+)", ticket.subject)
    
    if match:
        try:
            order_id = int(match.group(1))
            from app.models import Order, Refund
            order = Order.query.get(order_id)
            
            if order:
                # Calculate elapsed days since purchase
                delta = ticket.created_at - order.timestamp
                days_since = delta.days
                
                # Fetch basic product details for visual context (thumbnail/name)
                items_info = []
                for item in order.items:
                    items_info.append({
                        "id": item.product.id,
                        "name": item.product.name,
                        "image_url": item.product.image_url,
                        "price": item.price_at_purchase,
                        "quantity": item.quantity
                    })
                    
                order_data = {
                    'order_id': order.id,
                    'timestamp': order.timestamp.isoformat(),
                    'days_since_purchase_at_ticket_creation': days_since,
                    'total_amount': order.total_amount,
                    'items': items_info
                }
                
                # If this is specifically a refund
                if "Refund Request" in ticket.subject:
                    refund = Refund.query.filter_by(order_id=order_id).first()
                    if refund:
                        refund_data = {
                            'order_id': order_id,
                            'status': refund.status,
                            'reason': refund.reason,
                            'amount': order.total_amount
                        }
        except Exception as e:
            print(f"Failed to parse or load contextual order details: {e}")
            pass

    return jsonify({
        'id': ticket.id,
        'subject': ticket.subject,
        'status': ticket.status,
        'messages': messages,
        'user': ticket.user.username,
        'user_id': ticket.user_id,
        'refund': refund_data,
        'order_context': order_data
    }), 200

@support_bp.route('/<int:id>/action', methods=['POST'])
@jwt_required()
def action_ticket(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
        
    ticket = SupportTicket.query.get_or_404(id)
    
    # Allow if owner OR admin
    if ticket.user_id != current_user_id and (not current_user or current_user.role != 'admin'):
        return jsonify({"msg": "Access denied"}), 403
        
    data = request.get_json()
    action = data.get('action') # 'close', 'open', 'approve_refund', 'reject_refund'
    
    if action == 'close':
        ticket.status = 'closed'
    elif action == 'open':
        ticket.status = 'open'
    elif action in ['approve_refund', 'reject_refund']:
        # Refund actions strictly require admin role
        if not current_user or current_user.role != 'admin':
            return jsonify({"msg": "Admins only!"}), 403
            
        # Process refund logic
        if not data.get('order_id'):
            return jsonify({"msg": "Order ID required for refund action"}), 400
            
        from app.models import Refund, Order
        refund = Refund.query.filter_by(order_id=data['order_id']).first()
        if not refund:
            return jsonify({"msg": "Refund record not found"}), 404
            
        if action == 'approve_refund':
            refund.status = 'approved'
            refund.order.status = 'returned'
            # Also add a system message to the ticket
            system_msg = TicketMessage(
                ticket_id=ticket.id,
                sender_id=current_user_id,
                message="[SYSTEM] Refund request has been APPROVED. The order status is now 'Returned'."
            )
            db.session.add(system_msg)
        else:
            refund.status = 'rejected'
            refund.order.status = 'delivered'
            system_msg = TicketMessage(
                ticket_id=ticket.id,
                sender_id=current_user_id,
                message="[SYSTEM] Refund request has been REJECTED. The order remains 'Delivered'."
            )
            db.session.add(system_msg)
            
    db.session.commit()
    return jsonify({"msg": f"Action {action} processed successfully"}), 200

@support_bp.route('/<int:id>/message', methods=['POST'])
@jwt_required()
def reply_ticket(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    ticket = SupportTicket.query.get_or_404(id)
    
    # Allow if owner OR admin
    if ticket.user_id != current_user_id and (not current_user or current_user.role != 'admin'):
        return jsonify({"msg": "Access denied"}), 403
        
    data = request.get_json()
    if not data.get('message'):
        return jsonify({"msg": "Message required"}), 400
        
    new_msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user_id,
        message=data['message']
    )
    db.session.add(new_msg)
    
    # If admin replies, set to 'answered' (optional status, or keep 'open')
    # If user replies, set to 'open'
    # For now, simplistic login:
    if ticket.status == 'closed':
        ticket.status = 'open'
        
    # Increment unread count if the sender is an admin (not the ticket owner)
    if current_user_id != ticket.user_id:
        ticket.admin_unread_count += 1
        
    db.session.commit()
    return jsonify({"msg": "Reply sent"}), 201
