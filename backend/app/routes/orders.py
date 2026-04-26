from datetime import datetime
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
        product_obj = Product.query.get(item['id'])
        if not product_obj:
            continue
        total += product_obj.price * item['quantity']
        order_items.append(OrderItem(
            product=product_obj, 
            quantity=item['quantity'], 
            price_at_purchase=product_obj.price,
            selected_color=item.get('color'),
            is_build_header=item.get('is_build_header', False),
            build_id=item.get('build_id'),
            build_metadata=item.get('build_metadata')
        ))
        
    # Fetch user for phone number
    from app.models import User
    user = User.query.get(current_user_id)
    phone = user.phone_number if user else None

    # Handle COD Logic
    payment_method = data.get('payment_method', 'Card')
    final_total = total
    advance_amount = 0.0
    cod_balance = 0.0

    if payment_method == 'COD':
        final_total += 49  # ₹49 handling fee
        advance_amount = final_total * 0.10
        cod_balance = final_total - advance_amount
    
    new_order = Order(
        user_id=current_user_id, 
        total_amount=final_total, 
        shipping_address=shipping_str,
        phone_number=phone,
        payment_method=payment_method,
        advance_amount=advance_amount,
        cod_balance=cod_balance,
        history=[{"status": "pending", "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M'), "message": "Order Placed"}]
    )
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
                'name': i.product.name if i.product else 'Removed Product',
                'image_url': i.product.image_url if i.product else None,
                'qty': i.quantity,
                'price': i.price_at_purchase,
                'color': i.selected_color,
                'status': i.status,
                'is_build_header': i.is_build_header,
                'build_id': i.build_id,
                'build_metadata': i.build_metadata
            })
        results.append({
            'id': o.id,
            'date': o.timestamp,
            'total': o.total_amount,
            'items': items,
            'status': o.status,
            'shipping_address': o.shipping_address,
            'phone_number': o.phone_number
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

@orders_bp.route('/<int:id>/cancel_item', methods=['POST'])
@jwt_required()
def cancel_order_item(id):
    current_user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=id, user_id=current_user_id).first()

    if not order:
        return jsonify({"msg": "Order not found"}), 404

    if order.status != 'pending':
        return jsonify({"msg": "Cannot cancel items from an order that is not pending"}), 400

    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({"msg": "Product ID is required"}), 400

    # Find the specific item
    item_to_cancel = None
    for item in order.items:
        if item.product_id == int(product_id):
            item_to_cancel = item
            break
            
    if not item_to_cancel:
        return jsonify({"msg": "Product not found in this order"}), 404

    # Subtract the cost from the total
    item_total = item_to_cancel.price_at_purchase * item_to_cancel.quantity
    order.total_amount = max(0, order.total_amount - item_total)

    # Change the status instead of deleting the item
    item_to_cancel.status = 'cancelled'
    
    # If this was the last active item, cancel the whole order
    active_items = OrderItem.query.filter_by(order_id=order.id, status='active').count()
    if active_items == 0:
        order.status = 'cancelled'

    db.session.commit()
    return jsonify({
        "msg": "Item cancelled successfully", 
        "new_total": order.total_amount,
        "order_status": order.status
    }), 200

@orders_bp.route('/<int:id>/invoice', methods=['GET'])
def get_invoice(id):
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
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                {item.product.name}
                {f" <br/><small style='color: #661; margin-top: 2px; display: block;'>Color: {item.selected_color}</small>" if item.selected_color else ""}
            </td>
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
    if not current_user or current_user.role not in ['admin', 'staff', 'delivery_agent']:
        return jsonify({"msg": "Admins, Staff, and Delivery Agents only!"}), 403

    orders = Order.query.order_by(Order.timestamp.desc()).all()
    result = []
    for o in orders:
        items = []
        for i in o.items:
            items.append({
                'id': i.id,
                'product_id': i.product_id,
                'name': i.product.name if i.product else 'Removed Product',
                'image_url': i.product.image_url if i.product else None,
                'category': i.product.category if i.product and i.product.category else 'Uncategorized',
                'qty': i.quantity,
                'price': i.price_at_purchase,
                'color': i.selected_color,
                'is_build_header': i.is_build_header,
                'build_id': i.build_id,
                'build_metadata': i.build_metadata
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
            'phone_number': o.phone_number,
            'payment_method': o.payment_method,
            'delivery_proof': o.delivery_proof,
            'is_cod_received': o.is_cod_received,
            'collected_amount': o.collected_amount,
            'history': o.history or [],
            'items': items
        })
    return jsonify(result), 200

@orders_bp.route('/delivery', methods=['GET'])
@jwt_required()
def get_delivery_orders():
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['admin', 'staff', 'delivery_agent']:
        return jsonify({"msg": "Admins, Staff, and Delivery Agents only!"}), 403

    # Show Shipped and Delivered orders
    orders = Order.query.filter(Order.status.in_(['shipped', 'delivered'])).order_by(Order.timestamp.desc()).all()
    result = []
    for o in orders:
        items = []
        for i in o.items:
            items.append({
                'id': i.id,
                'name': i.product.name if i.product else 'Removed Product',
                'image_url': i.product.image_url if i.product else None,
                'qty': i.quantity,
                'price': i.price_at_purchase,
                'color': i.selected_color,
                'is_build_header': i.is_build_header,
                'build_id': i.build_id,
                'build_metadata': i.build_metadata
            })
            
        result.append({
            'id': o.id,
            'customer': o.customer.username if o.customer else 'Unknown',
            'date': o.timestamp.strftime('%Y-%m-%d %H:%M'),
            'status': o.status,
            'payment_method': o.payment_method,
            'payment_status': o.payment_status,
            'shipping_address': o.shipping_address,
            'phone_number': o.phone_number,
            'total': o.total_amount,
            'advance_amount': o.advance_amount or 0,
            'cod_balance': o.cod_balance or 0,
            'is_cod_received': o.is_cod_received,
            'collected_amount': o.collected_amount,
            'delivery_attempts': o.delivery_attempts or 0,
            'failure_reason': o.failure_reason,
            'failure_action': o.failure_action,
            'items': items
        })
    return jsonify(result), 200

@orders_bp.route('/<int:id>/deliver', methods=['PATCH'])
@jwt_required()
def confirm_delivery(id):
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['admin', 'delivery_agent', 'staff']:
        return jsonify({"msg": "Unauthorized role"}), 403

    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    # Save images
    order.delivery_proof = data.get('delivery_proof', [])
    
    # COD Handling
    if order.payment_method == 'COD':
        col_amount = float(data.get('collected_amount', 0))
        target_amount = order.cod_balance if order.cod_balance > 0 else order.total_amount
        
        if col_amount < target_amount:
            return jsonify({"msg": f"Collected amount ₹{col_amount} is less than balance due ₹{target_amount}"}), 400
        
        order.collected_amount = col_amount
        order.is_cod_received = True
        order.cod_received_at = datetime.utcnow()
        order.payment_status = 'paid'

    # Update Status
    order.status = 'delivered'
    
    h = list(order.history) if order.history else []
    h.append({
        "status": "delivered",
        "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
        "message": f"Delivered by Agent {current_user.username}"
    })
    order.history = h
    
    db.session.commit()
    return jsonify({"msg": "Order delivered successfully", "status": "delivered"}), 200

@orders_bp.route('/<int:id>/fail', methods=['PATCH'])
@jwt_required()
def report_failure(id):
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['admin', 'delivery_agent', 'staff']:
        return jsonify({"msg": "Unauthorized role"}), 403

    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    reason = data.get('reason')
    action = data.get('action') # 'reschedule', 'return'
    notes = data.get('notes', '')

    if not reason or not action:
        return jsonify({"msg": "Reason and Action are required"}), 400

    order.delivery_attempts = (order.delivery_attempts or 0) + 1
    order.failure_reason = reason
    order.failure_action = action
    
    msg = f"Delivery Failed: {reason}. Action taken: {action}."
    if notes:
        msg += f" Note: {notes}"

    h = list(order.history) if order.history else []
    h.append({
        "status": "failure",
        "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
        "message": msg,
        "agent": current_user.username
    })
    order.history = h

    if action == 'return':
        order.status = 'returned_to_warehouse'
    else:
        # reschedule - keep as shipped
        order.status = 'shipped'
    
    db.session.commit()
    return jsonify({"msg": "Failure reported successfully", "status": order.status}), 200

@orders_bp.route('/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(id):
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['admin', 'staff']:
        return jsonify({"msg": "Admins and Staff only!"}), 403

    order = Order.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')

    if new_status:
        if order.status != new_status:
            h = list(order.history) if order.history else []
            if not h or (len(h) > 0 and h[0].get('status') != 'pending'):
                h.insert(0, {
                    "status": "pending",
                    "timestamp": order.timestamp.strftime('%Y-%m-%d %H:%M'),
                    "message": "Order Placed"
                })
            
            order.status = new_status
            h.append({
                "status": new_status,
                "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                "message": "Updated via Admin Console"
            })
            order.history = h
    
    if data and 'tracking_number' in data:
        order.tracking_number = data['tracking_number']

    db.session.commit()
    return jsonify({"msg": "Order status updated", "status": order.status}), 200

@orders_bp.route('/<int:id>/payment', methods=['PATCH'])
@jwt_required()
def update_payment_status(id):
    current_user_id = int(get_jwt_identity())
    from app.models import User
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['admin', 'staff']:
        return jsonify({"msg": "Admins and Staff only!"}), 403

    order = Order.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('payment_status')

    if new_status:
        order.payment_status = new_status
        
    db.session.commit()
    return jsonify({"msg": "Payment status updated", "payment_status": order.payment_status}), 200
