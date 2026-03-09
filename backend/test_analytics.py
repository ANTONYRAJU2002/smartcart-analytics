from app import create_app, db
from app.analytics.data_loader import load_combined_sales_data, load_customer_rfm_data, load_order_items_data

app = create_app()
with app.app_context():
    print("Combined Sales:")
    df = load_combined_sales_data()
    print(df.head())
    
    print("\nRFM:")
    rfm = load_customer_rfm_data()
    print(rfm.head())
    
    print("\nOrder Items:")
    items = load_order_items_data()
    print(items)
