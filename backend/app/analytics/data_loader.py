import pandas as pd
from app import db
from app.models import Order, OrderItem, Product, OfflineSales

def load_combined_sales_data(start_date=None, end_date=None):
    """
    Fetch Online Orders and Offline Sales, combine into a single DataFrame.
    Schema: ['date', 'amount', 'profit', 'source']
    """
    # 1. Online Sales
    # Profit = (Price - Cost) * Qty
    # We need to join OrderItem with Product to get cost
    online_query = db.session.query(
        Order.timestamp, 
        OrderItem.quantity, 
        OrderItem.price_at_purchase, 
        Product.cost_price
    ).join(OrderItem, Order.id == OrderItem.order_id)\
     .join(Product, OrderItem.product_id == Product.id)

    if start_date:
        online_query = online_query.filter(Order.timestamp >= start_date)
    if end_date:
        online_query = online_query.filter(Order.timestamp <= end_date)
        
    online_df = pd.read_sql(online_query.statement, db.engine)
    
    if not online_df.empty:
        online_df['date'] = online_df['timestamp'].dt.date
        online_df['amount'] = online_df['quantity'] * online_df['price_at_purchase']
        online_df['profit'] = online_df['quantity'] * (online_df['price_at_purchase'] - online_df['cost_price'])
        online_df['source'] = 'Online'
        online_sales = online_df[['date', 'amount', 'profit', 'source']].groupby(['date', 'source']).sum().reset_index()
    else:
        online_sales = pd.DataFrame(columns=['date', 'amount', 'profit', 'source'])

    # 2. Offline Sales
    offline_query = db.session.query(OfflineSales)
    
    if start_date:
        offline_query = offline_query.filter(OfflineSales.date >= start_date)
    if end_date:
        offline_query = offline_query.filter(OfflineSales.date <= end_date)

    offline_df = pd.read_sql(offline_query.statement, db.engine)
    
    if not offline_df.empty:
        offline_df['amount'] = offline_df['total_sales']
        offline_df['profit'] = offline_df['total_profit']
        offline_df['source'] = 'Offline'
        offline_sales_cleaned = offline_df[['date', 'amount', 'profit', 'source']]
    else:
        offline_sales_cleaned = pd.DataFrame(columns=['date', 'amount', 'profit', 'source'])

    # 3. Combine
    combined_df = pd.concat([online_sales, offline_sales_cleaned], ignore_index=True)
    if not combined_df.empty:
        combined_df['date'] = pd.to_datetime(combined_df['date'])
    return combined_df

def load_order_items_data():
    """
    Load data for Market Basket Analysis.
    Returns list of transactions (list of product names).
    """
    orders = Order.query.all()
    transactions = []
    for order in orders:
        items = [item.product.name for item in order.items]
        if items:
            transactions.append(items)
    return transactions

def load_customer_rfm_data():
    """
    Load data for RFM Analysis (Online only).
    Returns DataFrame with UserID, Recency, Frequency, Monetary.
    """
    query = db.session.query(
        Order.user_id,
        Order.id.label('order_id'),
        Order.timestamp,
        Order.total_amount
    ).statement
    
    df = pd.read_sql(query, db.engine)
    
    if df.empty:
        return pd.DataFrame()

    now = df['timestamp'].max() # Or datetime.utcnow()
    
    rfm = df.groupby('user_id').agg({
        'timestamp': lambda x: (now - x.max()).days, # Recency
        'order_id': 'count', # Frequency
        'total_amount': 'sum' # Monetary
    }).reset_index()
    
    rfm.columns = ['user_id', 'recency', 'frequency', 'monetary']
    return rfm
