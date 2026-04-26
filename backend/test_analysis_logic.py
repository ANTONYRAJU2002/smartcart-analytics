import requests

# We need a token. Let's assume we can get one or just check the logic.
# Since we can't easily get a token here, let's mock the backend call inside a script with app context.

from app import create_app, db
from app.models import OfflineSales, User
import pandas as pd
from sqlalchemy import extract

app = create_app()

with app.app_context():
    # Simulate a request from Arjun (ID 3)
    current_user = User.query.get(3)
    is_global = True # As per StaffPortal logic
    
    if is_global:
        sales_q = db.session.query(OfflineSales)
    else:
        sales_q = db.session.query(OfflineSales).filter_by(staff_id=current_user.id)

    # No filters applied
    conn = db.session.connection()
    sales_df = pd.read_sql(sales_q.statement, conn)
    
    print(f"Sales DF shape: {sales_df.shape}")
    if not sales_df.empty:
        print("Columns:", sales_df.columns.tolist())
        pay_split = sales_df.groupby('payment_method')['total_amount'].sum().reset_index()
        print("\nPayment Split DF:")
        print(pay_split)
    else:
        print("Sales DF is empty!")
