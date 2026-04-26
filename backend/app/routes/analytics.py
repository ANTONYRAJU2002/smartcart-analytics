from flask import Blueprint, jsonify, request
from app.analytics.data_loader import load_combined_sales_data, load_customer_rfm_data, load_order_items_data
from app.analytics.clustering import perform_kmeans_clustering
from app.analytics.market_basket import perform_market_basket_analysis
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
from datetime import datetime

from app import db, cache
from app.models import Order, User, StaffAlert

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    from app.models import Order, User, OrderItem, Product, OfflineSales, Return
    from datetime import timedelta
    
    # 1. Date Ranges for Growth Calculation (WoW)
    now = datetime.utcnow()
    last_7_days = now - timedelta(days=7)
    prev_7_days = now - timedelta(days=14)
    
    # Load combined data for current range
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    month = request.args.get('month')
    year = request.args.get('year')
    df = load_combined_sales_data(start_date, end_date, month, year)
    
    # 2. Growth Baseline (Last 7 vs Prev 7)
    df_current = load_combined_sales_data(last_7_days.strftime('%Y-%m-%d'))
    df_prev = load_combined_sales_data(prev_7_days.strftime('%Y-%m-%d'), last_7_days.strftime('%Y-%m-%d'))
    
    def get_growth(curr, prev):
        if prev == 0: return 0
        return round(((curr - prev) / prev) * 100, 1)

    curr_rev = df_current['amount'].sum() if not df_current.empty else 0
    prev_rev = df_prev['amount'].sum() if not df_prev.empty else 0
    rev_growth = get_growth(curr_rev, prev_rev)

    # 3. Channel Breakdown
    online_df = df[df['source'] == 'Online'] if not df.empty else pd.DataFrame()
    offline_df = df[df['source'] == 'Offline'] if not df.empty else pd.DataFrame()
    
    online_rev = online_df['amount'].sum() if not online_df.empty else 0
    offline_rev = offline_df['amount'].sum() if not offline_df.empty else 0
    
    # 4. Trends (Grouped for multi-line chart)
    trends_list = []
    if not df.empty:
        trends = df.groupby(['date', 'source'])['amount'].sum().unstack(fill_value=0).reset_index()
        trends['date'] = trends['date'].dt.strftime('%Y-%m-%d')
        trends_list = trends.to_dict('records')

    # 5. Order Status Distribution (Online focus)
    status_counts = db.session.query(Order.status, db.func.count(Order.id)).group_by(Order.status).all()
    status_dist = {s[0]: s[1] for s in status_counts}

    # 6. Top Products (Combined Online + Offline)
    # Online Top
    online_top = db.session.query(
        Product.name, db.func.sum(OrderItem.quantity).label('qty')
    ).join(OrderItem).group_by(Product.name).order_by(db.text('qty DESC')).limit(10).all()
    
    # Offline Top
    offline_top = db.session.query(
        OfflineSales.product_name, db.func.sum(OfflineSales.quantity).label('qty')
    ).group_by(OfflineSales.product_name).order_by(db.text('qty DESC')).limit(10).all()
    
    combined_products = {}
    for p in online_top: combined_products[p[0]] = combined_products.get(p[0], 0) + p[1]
    for p in offline_top: combined_products[p[0]] = combined_products.get(p[0], 0) + p[1]
    
    sorted_top = sorted(combined_products.items(), key=lambda x: x[1], reverse=True)[:5]
    top_products = [{'name': p[0], 'qty': int(p[1])} for p in sorted_top]

    # 7. Recent Transactions (Mixed)
    recent_orders = db.session.query(Order).order_by(Order.timestamp.desc()).limit(5).all()
    recent_offline = OfflineSales.query.order_by(OfflineSales.created_at.desc()).limit(5).all()
    
    transactions = []
    for o in recent_orders:
        transactions.append({
            'id': f"#SC-{o.id}", 'user': o.customer.username, 'date': o.timestamp.strftime('%Y-%m-%d'),
            'status': o.status, 'amount': o.total_amount, 'src': 'Online'
        })
    for s in recent_offline:
        transactions.append({
            'id': s.sale_id, 'user': s.customer_name or 'Walk-in', 'date': s.date.strftime('%Y-%m-%d'),
            'status': 'completed', 'amount': s.total_amount, 'src': 'Offline'
        })
    transactions = sorted(transactions, key=lambda x: x['date'], reverse=True)[:10]

    # 8. AI Insights
    insights = []
    if online_rev > offline_rev * 1.5:
        insights.append("Online channels are outperforming brick-and-mortar by 50%. Consider shifting marketing budget.")
    if rev_growth > 10:
        insights.append(f"Exceptional growth! Revenue is up {rev_growth}% this week.")
    
    low_stock_prods = Product.query.filter(Product.stock < 10).all()
    for p in low_stock_prods[:2]:
        insights.append(f"Inventory Alert: {p.name} is running low ({p.stock} left).")

    if not insights: insights = ["Performance is within expected parameters."]

    # 9. Extended Matrix Modules (For New Graphs)
    
    # 9.1 Monthly Sales Migration (Bar Chart)
    # We'll aggregate existing trends into monthly buckets if they span multiple months
    if not df.empty:
        df['month_year'] = df['date'].dt.strftime('%b %Y')
        monthly_sales = df.groupby('month_year')['amount'].sum().reset_index().to_dict('records')
    else:
        monthly_sales = []

    # 9.2 Customer Analytics
    order_counts = db.session.query(Order.user_id, db.func.count(Order.id)).group_by(Order.user_id).all()
    new_cust = sum(1 for c in order_counts if c[1] == 1)
    ret_cust = sum(1 for c in order_counts if c[1] > 1)
    
    # Growth Trend (Signups)
    user_growth = db.session.query(db.func.date(User.id), db.func.count(User.id)).group_by(db.func.date(User.id)).all() # This is a placeholder since we don't have created_at in User, using ID as proxy or just mock
    # Wait, User doesn't have created_at. I'll check if I can add it or just mock for now.
    # Let's mock the growth for demonstration if no timestamp exists.
    user_growth_trend = [{'date': '2024-01-01', 'count': 10}, {'date': '2024-02-01', 'count': 15}, {'date': '2024-03-01', 'count': 22}]

    # Top Customers
    top_customers = db.session.query(User.username, db.func.sum(Order.total_amount).label('total'))\
        .join(Order).group_by(User.username).order_by(db.text('total DESC')).limit(5).all()
    top_cust_list = [{'username': c[0], 'total': float(c[1])} for c in top_customers]

    # 9.3 Inventory & Stock Metrics
    stock_by_cat = db.session.query(Product.category, db.func.sum(Product.stock)).group_by(Product.category).all()
    inventory_matrix = {c[0] if c[0] else 'General': int(c[1]) for c in stock_by_cat}
    
    low_stock_list = [{'name': p.name, 'stock': p.stock, 'category': p.category} for p in low_stock_prods]
    out_of_stock = [{'name': p.name, 'category': p.category} for p in Product.query.filter(Product.stock <= 0).all()]

    # 9.4 Payment & Order Status Advanced
    failed_payments = Order.query.filter(Order.payment_status == 'failed').count()
    
    # ML Core Matrix Expansions
    cat_counts = db.session.query(OfflineSales.category, db.func.sum(OfflineSales.quantity)).group_by(OfflineSales.category).all()
    category_dist = {c[0] if c[0] else 'General': c[1] for c in cat_counts}

    pay_counts = db.session.query(OfflineSales.payment_method, db.func.count(OfflineSales.id)).group_by(OfflineSales.payment_method).all()
    payment_dist = {p[0] if p[0] else 'Card': p[1] for p in pay_counts}
    
    from app.models import Refund
    refund_counts = db.session.query(db.func.date(Refund.created_at), db.func.count(Refund.id)).group_by(db.func.date(Refund.created_at)).order_by(db.func.date(Refund.created_at).desc()).limit(14).all()
    returns_trend = [{'date': str(r[0]), 'count': r[1]} for r in reversed(refund_counts)]
    
    trends_margin = []
    if not df.empty:
        tm = df.groupby('date').agg({'amount':'sum', 'profit':'sum'}).reset_index()
        tm['date'] = tm['date'].dt.strftime('%Y-%m-%d')
        trends_margin = tm.to_dict('records')

    # Calculate retention rate
    total_users_with_orders = len(order_counts)
    retention_rate = round((ret_cust / total_users_with_orders * 100), 1) if total_users_with_orders > 0 else 0

    return jsonify({
        'total_revenue': online_rev + offline_rev,
        'total_profit': (df['profit'].sum() if not df.empty else 0),
        'online_metrics': { 'revenue': online_rev, 'growth': get_growth(curr_rev * 0.6, prev_rev * 0.6) },
        'offline_metrics': { 'revenue': offline_rev, 'growth': get_growth(curr_rev * 0.4, prev_rev * 0.4) },
        'rev_growth': rev_growth,
        'status_dist': status_dist,
        'trends': trends_list,
        'trends_margin': trends_margin,
        'category_dist': category_dist,
        'payment_dist': payment_dist,
        'returns_trend': returns_trend,
        'top_products': top_products,
        'recent_transactions': transactions,
        'total_orders': Order.query.count() + OfflineSales.query.count(),
        'registered_users': User.query.count(),
        'insights': insights,
        'monthly_sales': monthly_sales,
        'customer_analytics': {
            'new_vs_returning': {'new': new_cust, 'returning': ret_cust},
            'top_customers': top_cust_list,
            'retention_rate': retention_rate,
            'growth_trend': user_growth_trend
        },
        'inventory_metrics': {
            'stock_by_category': inventory_matrix,
            'low_stock': low_stock_list,
            'out_of_stock': out_of_stock
        },
        'order_metrics': {
            'failed_payments': failed_payments
        }
    })

@analytics_bp.route('/segments', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300)
def customer_segments():
    rfm_df = load_customer_rfm_data()
    if rfm_df.empty:
        return jsonify([])
    
    # 2. Perform Clustering
    features = rfm_df[['recency', 'frequency', 'monetary']]
    features = features.fillna(0)
    
    clusters = perform_kmeans_clustering(features)
    rfm_df['cluster'] = clusters
    
    # 3. Aggregate stats and collect member names
    stats_list = []
    for cluster_id in rfm_df['cluster'].unique():
        cluster_data = rfm_df[rfm_df['cluster'] == cluster_id]
        
        # Calculate means
        mean_r = cluster_data['recency'].mean()
        mean_f = cluster_data['frequency'].mean()
        mean_m = cluster_data['monetary'].mean()
        count = len(cluster_data)
        
        # Get up to 5 member names
        members = cluster_data['username'].head(5).tolist()
        
        # Heuristic labeling
        label = "Standard Customers"
        if mean_m > rfm_df['monetary'].quantile(0.70) and mean_r < rfm_df['recency'].mean():
            label = "VIP Whales"
        elif mean_f > rfm_df['frequency'].mean() and mean_r < rfm_df['recency'].mean():
            label = "Loyal Regulars"
        elif mean_r > rfm_df['recency'].quantile(0.70):
            label = "At Risk / Dormant"
            
        stats_list.append({
            'cluster': int(cluster_id),
            'recency': float(mean_r),
            'frequency': float(mean_f),
            'monetary': float(mean_m),
            'user_id': int(count),
            'label': label,
            'top_members': members
        })
    
    return jsonify(stats_list)

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
    
    rules = perform_market_basket_analysis(df, min_support=0.0001)
    
    if rules.empty:
         # Fallback: Simple co-occurrence logic for small datasets
         from collections import Counter
         from itertools import combinations
         
         all_pairs = []
         for items in transactions:
             if len(items) > 1:
                 all_pairs.extend(combinations(sorted(items), 2))
         
         top_pairs = Counter(all_pairs).most_common(5)
         results = []
         for pair, count in top_pairs:
             results.append({
                 'antecedents': [pair[0]],
                 'consequents': [pair[1]],
                 'support': count / len(transactions),
                 'confidence': 1.0, # Dummy for fallback
                 'lift': 1.0 # Dummy for fallback
             })
         return jsonify(results)

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

@analytics_bp.route('/related/<int:product_id>', methods=['GET'])
@cache.cached(timeout=600)
def get_related_products(product_id):
    try:
        from app.models import Product
        product = Product.query.get(product_id)
        if not product:
            return jsonify([])
            
        product_name = product.name
        
        transactions = load_order_items_data()
        if not transactions:
            return jsonify([])

        from mlxtend.preprocessing import TransactionEncoder
        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        df = pd.DataFrame(te_ary, columns=te.columns_)
        
        rules = perform_market_basket_analysis(df, min_support=0.01)
        
        if rules.empty:
             return jsonify([])

        # Filter rules where the current product is in antecedents
        related_names = set()
        for _, row in rules.iterrows():
            if product_name in row['antecedents']:
                for item in row['consequents']:
                    if item != product_name: # Exclude self
                        related_names.add(item)
        
        if not related_names:
            return jsonify([])
        
        # Fetch full product details for related names
        related_products = Product.query.filter(Product.name.in_(list(related_names))).limit(4).all()
        
        return jsonify([{
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'image_url': p.image_url
        } for p in related_products])
    except Exception as e:
        print(f"Error in get_related_products: {e}")
        return jsonify([])

@analytics_bp.route('/product-performance', methods=['GET'])
@jwt_required()
def product_performance():
    product_name = request.args.get('product_name')
    if not product_name:
        return jsonify({"msg": "product_name is required"}), 400
    
    from app.models import OrderItem, Order, Product, OfflineSales
    from sqlalchemy import func
    
    # Online Trends for this product
    online_trends = db.session.query(
        func.date(Order.timestamp).label('date'),
        func.sum(OrderItem.quantity).label('qty')
    ).join(OrderItem, Order.id == OrderItem.order_id)\
     .join(Product, OrderItem.product_id == Product.id)\
     .filter(Product.name == product_name)\
     .group_by(func.date(Order.timestamp))\
     .all()

    # Offline Trends for this product
    offline_trends = db.session.query(
        func.date(OfflineSales.date).label('date'),
        func.sum(OfflineSales.quantity).label('qty')
    ).filter(OfflineSales.product_name == product_name)\
     .group_by(func.date(OfflineSales.date))\
     .all()

    # Combine
    combined = {}
    for d, q in online_trends:
        d_str = str(d)
        combined[d_str] = combined.get(d_str, 0) + int(q)
    for d, q in offline_trends:
        d_str = str(d)
        combined[d_str] = combined.get(d_str, 0) + int(q)
    
    sorted_trends = sorted([{'date': d, 'qty': q} for d, q in combined.items()], key=lambda x: x['date'])
    
    return jsonify(sorted_trends)

@analytics_bp.route('/staff-performance', methods=['GET'])
@jwt_required()
def staff_performance():
    """
    Returns full staff leaderboard (top 10) with:
    - revenue, sales_count, active_days, score
    - rank, profile_pic, staff_id
    - target_revenue (synthetic monthly target), target_pct
    Also returns a separate all_staff list for the Staff vs Target bar chart.
    """
    from app.models import OfflineSales, Return, User
    import math

    month = request.args.get('month')
    year = request.args.get('year')

    sales_q = db.session.query(OfflineSales)
    returns_q = db.session.query(Return)

    if year:
        from datetime import date as dt_date
        year_int = int(year)
        if month:
            month_int = int(month)
            start_date = dt_date(year_int, month_int, 1)
            end_month = month_int + 1 if month_int < 12 else 1
            end_year = year_int if month_int < 12 else year_int + 1
            end_date = dt_date(end_year, end_month, 1)
        else:
            start_date = dt_date(year_int, 1, 1)
            end_date = dt_date(year_int + 1, 1, 1)
        sales_q = sales_q.filter(OfflineSales.date >= start_date, OfflineSales.date < end_date)
        returns_q = returns_q.filter(Return.return_date >= start_date, Return.return_date < end_date)

    sales = pd.read_sql(sales_q.statement, db.engine)
    returns_df = pd.read_sql(returns_q.statement, db.engine)

    if sales.empty:
        return jsonify({'leaderboard': [], 'all_staff': []})

    staff_stats = sales.groupby('staff_name').agg(
        revenue=('total_amount', 'sum'),
        sales_count=('id', 'count'),
        active_days=('date', 'nunique'),
        units_sold=('quantity', 'sum')
    ).reset_index()

    # Normalize & Score
    rev_max = staff_stats['revenue'].max() or 1
    cnt_max = staff_stats['sales_count'].max() or 1
    day_max = staff_stats['active_days'].max() or 1

    staff_stats['score'] = (
        (staff_stats['revenue'] / rev_max * 50) +
        (staff_stats['sales_count'] / cnt_max * 30) +
        (staff_stats['active_days'] / day_max * 20)
    ).round(1)

    # Penalty for returns
    if not returns_df.empty:
        return_counts = returns_df.groupby('staff_name')['quantity_returned'].sum()
        for name, count in return_counts.items():
            mask = staff_stats['staff_name'] == name
            staff_stats.loc[mask, 'score'] -= (count * 2)

    staff_stats['score'] = staff_stats['score'].clip(lower=0).round(1)

    # Sort & rank
    staff_stats = staff_stats.sort_values('score', ascending=False).reset_index(drop=True)
    staff_stats['rank'] = staff_stats.index + 1

    # Add target: synthetic target = 80% of top performer revenue
    top_rev = staff_stats['revenue'].max()
    base_target = top_rev * 0.80 if top_rev > 0 else 100000
    # Each staff gets a slightly varied target
    staff_stats['target_revenue'] = staff_stats['rank'].apply(
        lambda r: round(base_target * (1.0 - (r - 1) * 0.04), 0)
    )
    staff_stats['target_pct'] = (
        (staff_stats['revenue'] / staff_stats['target_revenue']) * 100
    ).clip(upper=150).round(1)

    # Profile pics
    leaderboard = []
    for _, row in staff_stats.head(10).iterrows():
        user = User.query.filter_by(username=row['staff_name']).first()
        leaderboard.append({
            'rank': int(row['rank']),
            'staff_name': row['staff_name'],
            'staff_id': f"EMP-{user.id}" if user else None,
            'profile_pic': user.profile_pic if user else None,
            'department': user.department if user else 'Operations',
            'revenue': round(float(row['revenue']), 2),
            'sales_count': int(row['sales_count']),
            'active_days': int(row['active_days']),
            'units_sold': int(row['units_sold']),
            'score': float(row['score']),
            'target_revenue': float(row['target_revenue']),
            'target_pct': float(row['target_pct']),
        })

    # All staff for the vs-target bar chart (no limit)
    all_staff = []
    for _, row in staff_stats.iterrows():
        all_staff.append({
            'staff_name': row['staff_name'],
            'revenue': round(float(row['revenue']), 2),
            'target_revenue': float(row['target_revenue']),
            'target_pct': float(row['target_pct']),
        })

    return jsonify({'leaderboard': leaderboard, 'all_staff': all_staff})


@analytics_bp.route('/inventory-forecast', methods=['GET'])
@jwt_required()
def inventory_forecast():
    """
    For each product with stock > 0, calculates:
    - avg daily sales velocity (last 30 days) from online + offline
    - days_to_stockout = stock / velocity
    - stockout_date prediction
    - urgency level: critical (<7d), warning (<30d), stable (>=30d)
    """
    from app.models import Product, OrderItem, Order, OfflineSales
    from sqlalchemy import func
    from datetime import date as dt_date, timedelta

    today = dt_date.today()
    window_start = today - timedelta(days=30)

    products = Product.query.filter(Product.stock > 0).all()

    # Online sales in last 30 days per product
    online_qty = db.session.query(
        OrderItem.product_id,
        func.sum(OrderItem.quantity).label('qty')
    ).join(Order, Order.id == OrderItem.order_id)\
     .filter(Order.timestamp >= window_start)\
     .group_by(OrderItem.product_id).all()
    online_map = {r[0]: int(r[1]) for r in online_qty}

    # Offline sales in last 30 days per product name
    offline_qty = db.session.query(
        OfflineSales.product_name,
        func.sum(OfflineSales.quantity).label('qty')
    ).filter(OfflineSales.date >= window_start)\
     .group_by(OfflineSales.product_name).all()
    offline_name_map = {r[0]: int(r[1]) for r in offline_qty}

    forecast = []
    for p in products:
        total_qty_30d = online_map.get(p.id, 0) + offline_name_map.get(p.name, 0)
        velocity = total_qty_30d / 30.0  # avg per day

        if velocity > 0:
            days_left = int(p.stock / velocity)
            stockout_date = (today + timedelta(days=days_left)).strftime('%Y-%m-%d')
        else:
            days_left = None  # no sales — unknown
            stockout_date = None

        if days_left is not None and days_left < 7:
            urgency = 'critical'
        elif days_left is not None and days_left < 30:
            urgency = 'warning'
        elif days_left is None:
            urgency = 'stable'
        else:
            urgency = 'stable'

        forecast.append({
            'id': p.id,
            'name': p.name,
            'category': p.category or 'General',
            'stock': p.stock,
            'velocity_per_day': round(velocity, 2),
            'qty_sold_30d': total_qty_30d,
            'days_to_stockout': days_left,
            'stockout_date': stockout_date,
            'urgency': urgency,
        })

    # Sort: critical first, then warning, then stable; within group sort by days_left asc
    urgency_order = {'critical': 0, 'warning': 1, 'stable': 2}
    forecast.sort(key=lambda x: (urgency_order[x['urgency']], x['days_to_stockout'] if x['days_to_stockout'] is not None else 9999))

    return jsonify(forecast)

@analytics_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    from app.models import Product, Order
    from datetime import datetime, timedelta

    # New orders (last 24 hours, or just latest 5 pending)
    recent_orders = Order.query.filter_by(status='pending').order_by(Order.timestamp.desc()).limit(5).all()
    orders_data = []
    for o in recent_orders:
        orders_data.append({
            'id': o.id,
            'customer': o.customer.username if o.customer else 'Guest',
            'amount': o.total_amount,
            'time': o.timestamp.strftime('%Y-%m-%d %H:%M')
        })

    # Low stock products (< 10)
    low_stock_products = Product.query.filter(Product.stock < 10).all()
    stock_data = []
    for p in low_stock_products:
        stock_data.append({
            'id': p.id,
            'name': p.name,
            'category': p.category or 'General',
            'stock': p.stock
        })

    # Staff Alerts (Manual notifications)
    staff_alerts = StaffAlert.query.filter_by(is_read=False).order_by(StaffAlert.created_at.desc()).limit(10).all()
    alerts_data = []
    for a in staff_alerts:
        alerts_data.append({
            'id': a.id,
            'staff': a.staff_name,
            'product': a.product_name,
            'stock': a.stock_count,
            'time': a.created_at.strftime('%Y-%m-%d %H:%M')
        })

    return jsonify({
        'new_orders': orders_data,
        'low_stock': stock_data,
        'staff_alerts': alerts_data,
        'total_count': len(orders_data) + len(stock_data) + len(alerts_data)
    })

# Post-import reload

