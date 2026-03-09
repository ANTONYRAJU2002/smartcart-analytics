from flask import Blueprint, jsonify, request
from app import db
from app.models import Order, OrderItem, Product
from flask_jwt_extended import jwt_required, get_jwt_identity

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    address_id = data.get('address_id')
    
    # Verify address belongs to user
    address = None
    if address_id:
        from app.models import Address
        address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
        if not address:
            return jsonify({"msg": "Invalid address"}), 400

    # Get cart items
    # In a real app, we would fetch from Cart model. 
    # For now, let's assume the frontend sends items or key 'from_cart'=True implies we fetch from cart.
    # Looking at CartContext, it seems we don't store cart in DB yet? 
    # Wait, the previous steps didn't implement a DB-backed cart, it was local state in context?
    # correct. The CartContext is client-side.
    # So the frontend must send the items in the POST body.
    
    items = data.get('items', [])
    if not items:
        return jsonify({"msg": "No items in order"}), 400
        
    total = 0
    order_items = []
    
    # Format address as string
    shipping_str = ""
    if address:
        shipping_str = f"{address.street}, {address.city}, {address.state} {address.zip_code}, {address.country}"
    
    # Calculate total and verify products
    for item in items:
        product = Product.query.get(item['id'])
        if not product:
            continue
        total += product.price * item['quantity']
        order_items.append(OrderItem(product=product, quantity=item['quantity'], price_at_purchase=product.price))
        
    new_order = Order(user_id=current_user_id, total_amount=total, shipping_address=shipping_str)
    for oi in order_items:
        new_order.items.append(oi)
        
    db.session.add(new_order)
    db.session.commit()

    return jsonify({"msg": "Order placed successfully", "order_id": new_order.id}), 201

@orders_bp.route('/my', methods=['GET'])
@jwt_required()
def my_orders():
    current_user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=current_user_id).all()
    results = []
    for o in orders:
        items = []
        for i in o.items:
            items.append({
                'product_id': i.product_id,
                'name': i.product.name,
                'image_url': i.product.image_url,
                'qty': i.quantity,
                'price': i.price_at_purchase
            })
        results.append({
            'id': o.id,
            'date': o.timestamp,
            'total': o.total_amount,
            'items': items,
            'status': o.status,
            'shipping_address': o.shipping_address
        })
    return jsonify(results), 200

@orders_bp.route('/<int:id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(id):
    current_user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=id, user_id=current_user_id).first()

    if not order:
        return jsonify({"msg": "Order not found"}), 404

    if order.status != 'pending':
        return jsonify({"msg": "Cannot cancel order that is not pending"}), 400

    order.status = 'cancelled'
    db.session.commit()
    return jsonify({"msg": "Order cancelled"}), 200

@orders_bp.route('/<int:id>/refund', methods=['POST'])
@jwt_required()
def request_refund(id):
    current_user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=id, user_id=current_user_id).first()
    
    if not order:
        return jsonify({"msg": "Order not found"}), 404

    if order.status != 'completed':
        return jsonify({"msg": "Can only refund completed orders"}), 400
        
    # Check if already refunded
    from app.models import Refund
    existing = Refund.query.filter_by(order_id=id).first()
    if existing:
        return jsonify({"msg": "Refund already requested"}), 400

    data = request.get_json()
    new_refund = Refund(
        order_id=id,
        user_id=current_user_id,
        reason=data.get('reason', 'No reason provided')
    )
    
    # Auto-create Support Ticket for the refund
    from app.models import SupportTicket, TicketMessage
    new_ticket = SupportTicket(
        user_id=current_user_id,
        subject=f"Refund Request: Order #{id}"
    )
    db.session.add(new_ticket)
    db.session.flush() # Get ticket ID

    initial_msg = TicketMessage(
        ticket_id=new_ticket.id,
        sender_id=current_user_id,
        message=f"I would like to request a refund for Order #{id}. Reason: {new_refund.reason}"
    )
    db.session.add(initial_msg)
    
    order.status = 'return_requested'
    db.session.add(new_refund)
    db.session.commit()
    
    return jsonify({"msg": "Refund requested and support ticket created", "ticket_id": new_ticket.id}), 200

@orders_bp.route('/<int:id>/invoice', methods=['GET'])
def get_invoice(id):
    # For simplicity, we'll allow token via query param or header
    # But since window.open is easiest with query param, let's extract it manually if needed
    # However, flask_jwt_extended looks for headers mostly. 
    # We will use a mixed approach: Frontend will fetch via API (header) and get HTML blob, 
    # then open it. So this endpoint just needs standard jwt_required.
    
    from flask_jwt_extended import verify_jwt_in_request
    verify_jwt_in_request()
    
    current_user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=id, user_id=current_user_id).first()
    
    if not order:
        return jsonify({"msg": "Order not found"}), 404
        
    # Generate HTML
    items_html = ""
    for item in order.items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item.product.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item.price_at_purchase}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item.price_at_purchase * item.quantity}</td>
        </tr>
        """
        
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice #{order.id}</title>
        <style>
            body {{ font-family: sans-serif; padding: 40px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }}
        </style>
    </head>
    <body>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1>INVOICE</h1>
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print / Save as PDF</button>
        </div>
        <p><strong>Order ID:</strong> #{order.id}</p>
        <p><strong>Date:</strong> {order.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <hr>
        <p><strong>Customer:</strong> {order.customer.username} ({order.customer.email})</p>
        
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
        
        <h3 style="text-align: right; margin-top: 20px;">Grand Total: Rs. {order.total_amount}</h3>
        
        <footer style="margin-top: 50px; text-align: center; color: #777; font-size: 0.8rem;">
            Thank you for shopping with SmartCart!
        </footer>
    </body>
    </html>
    """
    return html, 200

# Admin Order Management

@orders_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_orders():
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    orders = Order.query.order_by(Order.timestamp.desc()).all()
    result = []
    for o in orders:
        items = []
        for i in o.items:
            items.append({
                'id': i.id,
                'product_id': i.product_id,
                'name': i.product.name,
                'image_url': i.product.image_url,
                'category': i.product.category if i.product.category else 'Uncategorized',
                'qty': i.quantity,
                'price': i.price_at_purchase
            })
            
        result.append({
            'id': o.id,
            'user': o.customer.username,
            'user_email': o.customer.email,
            'date': o.timestamp.strftime('%Y-%m-%d %H:%M'),
            'total': o.total_amount,
            'status': o.status,
            'payment_status': o.payment_status,
            'tracking_number': o.tracking_number,
            'shipping_address': o.shipping_address,
            'items': items
        })
    return jsonify(result), 200

@orders_bp.route('/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(id):
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    order = Order.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status:
        order.status = new_status
    
    if 'tracking_number' in data:
        order.tracking_number = data['tracking_number']

    db.session.commit()
    return jsonify({"msg": "Order status updated", "status": order.status}), 200

@orders_bp.route('/<int:id>/payment', methods=['PATCH'])
@jwt_required()
def update_payment_status(id):
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admins only!"}), 403

    order = Order.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('payment_status')

    if new_status:
        order.payment_status = new_status
        
    db.session.commit()
    return jsonify({"msg": "Payment status updated", "payment_status": order.payment_status}), 200
@orders_bp.route('/admin/refunds', methods=['GET'])
@jwt_required()
def get_all_refunds():
    from app.models import User, Refund
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if admin.role != 'admin':
        return jsonify({"msg": "Admin access required"}), 403
    
    refunds = Refund.query.all()
    results = []
    for r in refunds:
        results.append({
            'id': r.id,
            'order_id': r.order_id,
            'user': r.user.username,
            'reason': r.reason,
            'status': r.status,
            'date': r.created_at
        })
    return jsonify(results), 200

@orders_bp.route('/admin/refunds/<int:id>/action', methods=['POST'])
@jwt_required()
def action_refund(id):
    from app.models import User, Refund
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if admin.role != 'admin':
        return jsonify({"msg": "Admin access required"}), 403
    
    data = request.get_json()
    action = data.get('action') # 'approve' or 'reject'
    
    refund = Refund.query.get_or_404(id)
    order = refund.order
    
    if action == 'approve':
        refund.status = 'approved'
        order.status = 'returned'
    elif action == 'reject':
        refund.status = 'rejected'
        order.status = 'delivered' # Revert to delivered
    else:
        return jsonify({"msg": "Invalid action"}), 400
        
    db.session.commit()
    return jsonify({"msg": f"Refund {action}ed"}), 200
