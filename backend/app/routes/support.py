from flask import Blueprint, jsonify, request
from app import db
from app.models import SupportTicket, TicketMessage, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

support_bp = Blueprint('support', __name__)

@support_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data.get('subject') or not data.get('message'):
        return jsonify({"msg": "Subject and message required"}), 400

    new_ticket = SupportTicket(
        user_id=current_user_id,
        subject=data['subject']
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

@support_bp.route('/', methods=['GET'])
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
        
    messages = []
    for m in ticket.messages.order_by(TicketMessage.created_at).all():
        messages.append({
            'id': m.id,
            'sender': m.sender.username,
            'sender_id': m.sender_id,
            'message': m.message,
            'created_at': m.created_at
        })
        
    # Check for associated refund
    refund_data = None
    if "Refund Request" in ticket.subject:
        from app.models import Refund
        # Extract order ID from subject "Refund Request: Order #123"
        try:
            order_id = int(ticket.subject.split('#')[-1])
            refund = Refund.query.filter_by(order_id=order_id).first()
            if refund:
                refund_data = {
                    'order_id': order_id,
                    'status': refund.status,
                    'reason': refund.reason,
                    'amount': refund.order.total_amount
                }
        except:
            pass

    return jsonify({
        'id': ticket.id,
        'subject': ticket.subject,
        'status': ticket.status,
        'messages': messages,
        'user': ticket.user.username,
        'user_id': ticket.user_id,
        'refund': refund_data
    }), 200

@support_bp.route('/<int:id>/action', methods=['POST'])
@jwt_required()
def action_ticket(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403
        
    ticket = SupportTicket.query.get_or_404(id)
    data = request.get_json()
    action = data.get('action') # 'close', 'open', 'approve_refund', 'reject_refund'
    
    if action == 'close':
        ticket.status = 'closed'
    elif action == 'open':
        ticket.status = 'open'
    elif action in ['approve_refund', 'reject_refund']:
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
        
    db.session.commit()
    return jsonify({"msg": "Reply sent"}), 201
