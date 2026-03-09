from flask import Blueprint, jsonify, request
from app import db
from app.models import OfflineSales, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import csv
import io

offline_bp = Blueprint('offline', __name__)

@offline_bp.route('/', methods=['POST'])
@jwt_required()
def add_offline_sales():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    data = request.get_json()
    date_str = data.get('date') # YYYY-MM-DD
    sales_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()

    entry = OfflineSales(
        date=sales_date,
        total_sales=data['total_sales'],
        total_profit=data['total_profit'],
        staff_id=current_user.id
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"msg": "Offline sales entry added"}), 201

@offline_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_staff_stats():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role not in ['staff', 'admin']:
        return jsonify({"msg": "Staff only!"}), 403

    # Query entries for this specific staff member
    entries = OfflineSales.query.filter_by(staff_id=current_user.id).order_by(OfflineSales.date.desc()).all()
    
    total_sales = sum(e.total_sales for e in entries)
    total_profit = sum(e.total_profit for e in entries)
    entry_count = len(entries)
    
    # Return 10 most recent for history
    history = []
    for e in entries[:10]:
        history.append({
            'id': e.id,
            'date': e.date.strftime('%Y-%m-%d'),
            'sales': e.total_sales,
            'profit': e.total_profit
        })

    return jsonify({
        'total_sales': total_sales,
        'total_profit': total_profit,
        'entry_count': entry_count,
        'history': history,
        'is_approved': current_user.is_approved
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
            # Expected columns: date (YYYY-MM-DD), sales, profit
            date_str = row.get('date')
            sales = float(row.get('sales', 0))
            profit = float(row.get('profit', 0))
            
            sales_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()
            
            entry = OfflineSales(
                date=sales_date,
                total_sales=sales,
                total_profit=profit,
                staff_id=current_user.id
            )
            db.session.add(entry)
            entries_added += 1
        
        db.session.commit()
        return jsonify({"msg": f"Successfully uploaded {entries_added} entries"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error processing CSV: {str(e)}"}), 500
