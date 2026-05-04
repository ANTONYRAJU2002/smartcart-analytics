from flask import Blueprint, jsonify, request
from app import db
from app.models import OfflineSales, User, Return, Product, StaffAlert
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from datetime import datetime
import csv
import io
import random
import string
import pandas as pd

offline_bp = Blueprint('offline', __name__)

def generate_sale_id():
    """Generates a unique Sale ID: OFF-YYYYMMDD-XXXX"""
    date_str = datetime.utcnow().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"OFF-{date_str}-{random_str}"

@offline_bp.route('', methods=['POST'])
@jwt_required()
def add_offline_sales():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    data = request.get_json()
    
    # Required fields validation
    required_fields = ['staff_name', 'product_name', 'quantity', 'price']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"msg": f"Missing required field: {field}"}), 400

    qty = int(data.get('quantity', 0))
    price = float(data.get('price', 0))
    discount = float(data.get('offline_discount', 0))
    
    if qty <= 0 or price < 0:
        return jsonify({"msg": "Invalid quantity or price"}), 400

    date_str = data.get('date') # YYYY-MM-DD
    sales_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()

    sale_id = data.get('sale_id')
    if not sale_id:
        sale_id = generate_sale_id()
        # Verify uniqueness
        while OfflineSales.query.filter_by(sale_id=sale_id).first():
            sale_id = generate_sale_id()

    entry = OfflineSales(
        sale_id=sale_id,
        staff_name=data['staff_name'],
        staff_unique_id=data.get('staff_unique_id'),
        product_id=data.get('product_id'),
        product_name=data['product_name'],
        category=data.get('category') or 'General',
        sub_category=data.get('sub_category') or 'General',
        quantity=qty,
        price=price,
        offline_discount=discount,
        total_amount=(price - discount) * qty,
        payment_method=data.get('payment_method', 'Cash'),
        date=sales_date,
        staff_id=current_user.id,
        customer_name=data.get('customer_name'),
        customer_phone=data.get('customer_phone'),
        notes=data.get('notes')
    )

    # If product_id is provided, reduce stock and get cost_price
    if entry.product_id:
        product = Product.query.get(entry.product_id)
        if product:
            product.stock -= qty
            entry.cost_price = product.cost_price

    db.session.add(entry)
    db.session.commit()
    return jsonify({"msg": "Offline sales entry added", "sale_id": sale_id}), 201

@offline_bp.route('/return', methods=['POST'])
@jwt_required()
def process_return():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    data = request.get_json()
    sale_id = data.get('sale_id')
    if not sale_id:
        return jsonify({"msg": "Sale ID is required"}), 400

    # Fetch original sale
    original_sale = OfflineSales.query.filter_by(sale_id=sale_id).first()
    if not original_sale:
        return jsonify({"msg": "Sale not found"}), 404

    qty_to_return = int(data.get('quantity', 1))
    
    # Validation
    already_returned = db.session.query(db.func.sum(Return.quantity_returned)).filter_by(sale_id=sale_id).scalar() or 0
    if already_returned + qty_to_return > original_sale.quantity:
        return jsonify({"msg": "Cannot return more than originally sold"}), 400

    return_entry = Return(
        sale_id=sale_id,
        product_name=original_sale.product_name,
        staff_name=current_user.username,
        quantity_returned=qty_to_return,
        refund_amount=(original_sale.price * qty_to_return),
        return_reason=data.get('reason', 'Not specified'),
        return_date=datetime.utcnow().date()
    )

    # Increase stock if product_id exists
    if original_sale.product_id:
        product = Product.query.get(original_sale.product_id)
        if product:
            product.stock += qty_to_return

    db.session.add(return_entry)
    db.session.commit()
    return jsonify({"msg": "Return processed successfully"}), 201

@offline_bp.route('/returns', methods=['GET'])
@jwt_required()
def get_staff_returns():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    # All authenticated staff/admin can see all returns (business-level record)
    returns = Return.query.order_by(Return.created_at.desc()).all()

    return_history = []
    for r in returns:
        return_history.append({
            'id': r.id,
            'sale_id': r.sale_id,
            'product_name': r.product_name,
            'staff_name': r.staff_name,
            'quantity_returned': r.quantity_returned,
            'refund_amount': r.refund_amount,
            'return_reason': r.return_reason,
            'return_date': r.return_date.strftime('%Y-%m-%d') if r.return_date else '',
            'created_at': r.created_at.strftime('%Y-%m-%d %H:%M') if r.created_at else ''
        })

    return jsonify(return_history), 200

@offline_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_staff_stats():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    # Support global stats for staff and admins if requested
    requested_global = request.args.get('global') == 'true'
    is_global = requested_global and current_user.role in ['admin', 'staff']
    
    # Aggregation in DB
    if is_global:
        base_query = db.session.query(OfflineSales)
    else:
        base_query = db.session.query(OfflineSales).filter(OfflineSales.staff_id == current_user.id)

    # Date Filtering
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    day = request.args.get('day', type=int)

    if year: base_query = base_query.filter(extract('year', OfflineSales.date) == year)
    if month: base_query = base_query.filter(extract('month', OfflineSales.date) == month)
    if day: base_query = base_query.filter(extract('day', OfflineSales.date) == day)
    
    total_revenue = base_query.with_entities(func.sum(OfflineSales.total_amount)).scalar() or 0
    entry_count = base_query.count()
    
    today_date = datetime.utcnow().date()
    today_sales = base_query.filter(OfflineSales.date == today_date).with_entities(func.sum(OfflineSales.total_amount)).scalar() or 0
    avg_value = total_revenue / entry_count if entry_count > 0 else 0
    
    no_history = request.args.get('no_history') == 'true'
    history = []
    if not no_history:
        entries = base_query.order_by(OfflineSales.created_at.desc()).limit(1000).all()
        # Get list of returned sale IDs to flag history items
        returned_sale_ids = {r.sale_id for r in Return.query.filter(Return.sale_id.in_([e.sale_id for e in entries])).all()}
        
        for e in entries:
            history.append({
                'sale_id': e.sale_id,
                'date': e.date.strftime('%Y-%m-%d') if e.date else '',
                'created_at': e.created_at.strftime('%Y-%m-%d %H:%M') if e.created_at else '',
                'product': e.product_name,
                'category': e.category or '',
                'quantity': e.quantity,
                'price': float(e.price or 0),
                'discount': float(e.offline_discount or 0),
                'amount': float(e.total_amount or 0),
                'method': e.payment_method,
                'staff': e.staff_name,
                'customer_name': e.customer_name or '',
                'customer_phone': e.customer_phone or '',
                'notes': e.notes or '',
                'is_returned': e.sale_id in returned_sale_ids
            })

    return jsonify({
        'total_revenue': total_revenue,
        'entry_count': entry_count,
        'today_sales': today_sales,
        'avg_transaction_value': avg_value,
        'history': history,
        'is_global': is_global,
        'server_time': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
    }), 200

@offline_bp.route('/upload', methods=['POST'])
@jwt_required()
def bulk_upload_offline_sales():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"msg": "Admin only for bulk upload!"}), 403

    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if not file.filename.endswith('.csv'):
        return jsonify({"msg": "Only CSV files allowed"}), 400

    try:
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.DictReader(stream)
        
        entries_added = 0
        for row in csv_input:
            sale_id = row.get('Sale ID')
            if not sale_id:
                return jsonify({"msg": "Sale ID is mandatory for all entries in the CSV"}), 400

            if OfflineSales.query.filter_by(sale_id=sale_id).first():
                continue

            qty = int(row.get('Quantity', 0))
            price = float(row.get('Price', 0))
            discount = float(row.get('Offline Discount', 0))
            cost_price = row.get('Cost Price')
            date_str = row.get('Date')
            sales_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()
            
            entry = OfflineSales(
                sale_id=sale_id,
                staff_name=row.get('Staff Name', 'System'),
                staff_unique_id=row.get('Staff ID'),
                product_id=row.get('Product ID'),
                product_name=row.get('Product Name', 'Unknown'),
                category=row.get('Category', 'General'),
                sub_category=row.get('Sub Category'),
                quantity=qty,
                price=price,
                offline_discount=discount,
                cost_price=float(cost_price) if cost_price else None,
                total_amount=(price - discount) * qty,
                payment_method=row.get('Payment Method', 'Cash'),
                date=sales_date,
                staff_id=current_user.id,
                customer_name=row.get('Customer Name'),
                customer_phone=row.get('Customer Phone'),
                notes=row.get('Notes')
            )
            # Update stock and fetch cost_price if product_id is provided
            if entry.product_id:
                product = Product.query.get(entry.product_id)
                if product:
                    # Only reduce stock if the sale is from today (prevent historical data from depleting current stock)
                    if entry.date == datetime.utcnow().date():
                        product.stock -= qty
                    
                    if not entry.cost_price:
                        entry.cost_price = product.cost_price

            db.session.add(entry)
            entries_added += 1
        
        db.session.commit()
        return jsonify({"msg": f"Successfully uploaded {entries_added} entries"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error processing CSV: {str(e)}"}), 500

@offline_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    month = request.args.get('month')
    year = request.args.get('year')
    
    sales_q = db.session.query(OfflineSales)
    returns_q = db.session.query(Return)
    
    if year:
        from datetime import date
        year = int(year)
        if month:
            month = int(month)
            start_date = date(year, month, 1).strftime('%Y-%m-%d')
            if month == 12:
                end_date = date(year + 1, 1, 1).strftime('%Y-%m-%d')
            else:
                end_date = date(year, month + 1, 1).strftime('%Y-%m-%d')
        else:
            start_date = date(year, 1, 1).strftime('%Y-%m-%d')
            end_date = date(year + 1, 1, 1).strftime('%Y-%m-%d')
            
        sales_q = sales_q.filter(OfflineSales.date >= start_date, OfflineSales.date < end_date)
        returns_q = returns_q.filter(Return.return_date >= start_date, Return.return_date < end_date)

    conn = db.session.connection()
    sales = pd.read_sql(sales_q.statement, conn)
    returns = pd.read_sql(returns_q.statement, conn)
    
    if sales.empty:
        return jsonify([])

    staff_stats = sales.groupby('staff_name').agg({
        'total_amount': 'sum',
        'id': 'count',
        'date': 'nunique'
    }).rename(columns={'total_amount': 'revenue', 'id': 'sales_count', 'date': 'active_days'})

    if len(staff_stats) > 0:
        rev_max = staff_stats['revenue'].max() or 1
        cnt_max = staff_stats['sales_count'].max() or 1
        day_max = staff_stats['active_days'].max() or 1
        
        staff_stats['score'] = (
            (staff_stats['revenue'] / rev_max * 50) +
            (staff_stats['sales_count'] / cnt_max * 30) +
            (staff_stats['active_days'] / day_max * 20)
        )

    if not returns.empty:
        return_counts = returns.groupby('staff_name')['quantity_returned'].sum()
        for name, count in return_counts.items():
            if name in staff_stats.index:
                staff_stats.at[name, 'score'] -= (count * 2)

    leaderboard = staff_stats.sort_values(by='score', ascending=False).head(5).reset_index().to_dict('records')

    for entry in leaderboard:
        staff_user = User.query.filter_by(username=entry['staff_name']).first()
        entry['profile_pic'] = staff_user.profile_pic if staff_user and staff_user.profile_pic else None
        entry['staff_id'] = f"EMP-{staff_user.id}" if staff_user else None

    return jsonify(leaderboard)

@offline_bp.route('/staff/list', methods=['GET'])
@jwt_required()
def get_staff_list():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    staff_members = User.query.filter_by(role='staff', is_approved=True).all()
    if current_user.role == 'admin' and current_user not in staff_members:
        staff_members.append(current_user)

    result = [{"id": s.id, "username": s.username} for s in staff_members]
    return jsonify(result), 200

@offline_bp.route('/analysis', methods=['GET'])
@jwt_required()
def get_offline_analysis():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    requested_global = request.args.get('global') == 'true'
    is_global = requested_global and current_user.role in ['admin', 'staff']
    
    if is_global:
        sales_q = db.session.query(OfflineSales)
    else:
        sales_q = db.session.query(OfflineSales).filter_by(staff_id=current_user.id)

    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    day = request.args.get('day', type=int)

    if year: sales_q = sales_q.filter(extract('year', OfflineSales.date) == year)
    if month: sales_q = sales_q.filter(extract('month', OfflineSales.date) == month)
    if day: sales_q = sales_q.filter(extract('day', OfflineSales.date) == day)
    
    try:
        conn = db.session.connection()
        sales_df = pd.read_sql(sales_q.statement, conn)
    except Exception as e:
        return jsonify({"msg": "Error analyzing data", "error": str(e)}), 500
    
    if sales_df.empty:
        return jsonify({
            "daily_sales": [],
            "category_split": [],
            "payment_split": [],
            "staff_perf": []
        })

    sales_df['date'] = pd.to_datetime(sales_df['date'])
    daily = sales_df.groupby('date')['total_amount'].sum().reset_index()
    daily = daily.sort_values('date').tail(30)
    daily_sales = daily.apply(lambda x: {"date": x['date'].strftime('%b %d'), "amount": float(x['total_amount'])}, axis=1).tolist()

    cat_split = sales_df.groupby('category')['total_amount'].sum().reset_index()
    category_split = cat_split.apply(lambda x: {"name": x['category'], "value": float(x['total_amount'])}, axis=1).tolist()

    pay_split = sales_df.groupby('payment_method')['total_amount'].sum().reset_index()
    payment_split = pay_split.apply(lambda x: {"name": x['payment_method'], "value": float(x['total_amount'])}, axis=1).tolist()

    staff_perf = []
    if is_global:
        perf = sales_df.groupby('staff_name')['total_amount'].sum().reset_index().sort_values('total_amount', ascending=False)
        staff_perf = perf.apply(lambda x: {"name": x['staff_name'], "value": float(x['total_amount'])}, axis=1).tolist()

    return jsonify({
        "daily_sales": daily_sales,
        "category_split": category_split,
        "payment_split": payment_split,
        "staff_perf": staff_perf
    }), 200

@offline_bp.route('/staff-alert', methods=['POST'])
@jwt_required()
def create_staff_alert():
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({"msg": "Forbidden"}), 403
        
        data = request.json
        product_id = data.get('product_id')
        product_name = data.get('product_name')
        stock_count = data.get('stock_count')
        
        alert = StaffAlert(
            staff_name=current_user.username,
            product_id=product_id,
            product_name=product_name,
            stock_count=stock_count
        )
        db.session.add(alert)
        db.session.commit()
        
        return jsonify({"msg": "Alert sent to admin"}), 201
    except Exception as e:
        import traceback
        with open('backend_error.log', 'a') as f:
            f.write(f"\n[{datetime.utcnow()}] Staff Alert Error: {str(e)}\n")
            f.write(traceback.format_exc())
        return jsonify({"msg": f"Internal Error: {str(e)}"}), 500
