from app import create_app, db
from app.models import OfflineSales, Return
import pandas as pd
from datetime import date

app = create_app()
with app.app_context():
    print("--- All Offline Sales ---")
    sales = OfflineSales.query.all()
    for s in sales[:5]:
        print(f"ID: {s.id}, Staff: {s.staff_name}, Date: {s.date}")
    
    print(f"\nTotal Offline Sales: {len(sales)}")
    
    # Test specific filtering (April 2026 as per local time)
    year = 2026
    month = 4
    start_date = date(year, month, 1).strftime('%Y-%m-%d')
    end_date = date(year, month + 1, 1).strftime('%Y-%m-%d')
    
    filtered_sales = OfflineSales.query.filter(OfflineSales.date >= start_date, OfflineSales.date < end_date).all()
    print(f"\nFiltered Sales (April 2026): {len(filtered_sales)}")
    
    if len(filtered_sales) == 0:
        print("WARNING: No sales found for April 2026. Checking other dates...")
        all_dates = db.session.query(OfflineSales.date).distinct().all()
        print(f"Available dates in DB: {[str(d[0]) for d in all_dates]}")
