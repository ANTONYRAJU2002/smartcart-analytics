from flask import Blueprint, jsonify, request
from app.analytics.data_loader import load_combined_sales_data, load_customer_rfm_data, load_order_items_data
from app.analytics.clustering import perform_kmeans_clustering
from app.analytics.market_basket import perform_market_basket_analysis
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
from datetime import datetime

from app import db, cache
from app.models import Order, User

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300, query_string=True)
def dashboard_stats():
    # 1. Total Stats
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Optional: Validate dates
    
    df = load_combined_sales_data(start_date, end_date)
    
    # Initialize defaults
    total_revenue = 0
    total_profit = 0
    online_rev = 0
    offline_rev = 0
    trends_list = []
    
    if not df.empty:
        total_revenue = df['amount'].sum()
        total_profit = df['profit'].sum()
        
        online_rev = df[df['source'] == 'Online']['amount'].sum()
        offline_rev = df[df['source'] == 'Offline']['amount'].sum()
        
        # 2. Trends
        trends = df.groupby(['date', 'source'])['amount'].sum().unstack(fill_value=0).reset_index()
        trends['date'] = trends['date'].dt.strftime('%Y-%m-%d')
        trends_list = trends.to_dict('records')

    # 3. Inventory Demand (Top Selling Products from Online Data)
    from app.models import OrderItem, Product
    top_products_query = db.session.query(
        Product.name,
        db.func.sum(OrderItem.quantity).label('total_qty')
    ).join(Product).group_by(Product.name).order_by(db.text('total_qty DESC')).limit(5).all()
    
    top_products = [{'name': p[0], 'qty': p[1]} for p in top_products_query]

    # 4. Recent Transactions (Online)
    recent_orders = db.session.query(Order).join(User).order_by(Order.timestamp.desc()).limit(10).all()
    recent_transactions = []
    for o in recent_orders:
        first_item = o.items.first()
        category = first_item.product.category if first_item and first_item.product else "Mixed"
        
        recent_transactions.append({
            'id': f"#SC-{o.id}",
            'name': o.customer.username,
            'cat': category,
            'src': 'Online',
            'amt': o.total_amount,
            'status': o.status
        })

    # 5. Counts
    total_orders_count = Order.query.count()
    registered_users_count = User.query.count()

    return jsonify({
        'total_revenue': total_revenue,
        'total_profit': total_profit,
        'online_revenue': online_rev,
        'offline_revenue': offline_rev,
        'trends': trends_list,
        'top_products': top_products,
        'recent_transactions': recent_transactions,
        'total_orders': total_orders_count,
        'registered_users': registered_users_count
    })

@analytics_bp.route('/segments', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300)
def customer_segments():
    rfm_df = load_customer_rfm_data()
    if rfm_df.empty:
        return jsonify([])
    
    # Perform Clustering
    features = rfm_df[['recency', 'frequency', 'monetary']]
    # Simple fix for NaN
    features = features.fillna(0)
    
    clusters = perform_kmeans_clustering(features)
    rfm_df['cluster'] = clusters
    
    stats = rfm_df.groupby('cluster').agg({
        'recency': 'mean',
        'frequency': 'mean',
        'monetary': 'mean',
        'user_id': 'count'
    }).reset_index()
    
    return jsonify(stats.to_dict('records'))

@analytics_bp.route('/associations', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300)
def market_basket():
    transactions = load_order_items_data()
    if not transactions:
        return jsonify([])

    # Convert to one-hot for mlxtend
    from mlxtend.preprocessing import TransactionEncoder
    te = TransactionEncoder()
    te_ary = te.fit(transactions).transform(transactions)
    df = pd.DataFrame(te_ary, columns=te.columns_)
    
    rules = perform_market_basket_analysis(df, min_support=0.01)
    
    if rules.empty:
         return jsonify([])

    # Filter top rules
    top_rules = rules.sort_values(by='lift', ascending=False).head(10)
    
    results = []
    for _, row in top_rules.iterrows():
        results.append({
            'antecedents': list(row['antecedents']),
            'consequents': list(row['consequents']),
            'support': row['support'],
            'confidence': row['confidence'],
            'lift': row['lift']
        })
        
    return jsonify(results)

@analytics_bp.route('/export', methods=['GET'])
@jwt_required()
def export_report():
    import csv
    from io import StringIO
    from werkzeug.wrappers import Response

    df = load_combined_sales_data()
    
    if df.empty:
         return jsonify({"msg": "No data to export"}), 400

    # Create CSV in memory
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Date', 'Source', 'Revenue', 'Profit'])
    
    for _, row in df.iterrows():
        cw.writerow([row['date'], row['source'], row['amount'], row['profit']])

    output = si.getvalue()
    
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=analytics_report.csv"}
    )
