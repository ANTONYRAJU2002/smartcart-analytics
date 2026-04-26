from app import create_app, db
from app.models import OfflineSales, Return, User
import pandas as pd
from datetime import date
from flask import jsonify

app = create_app()
with app.app_context():
    # Simulate get_leaderboard logic for April 2026
    month = '4'
    year = '2026'
    
    sales_q = db.session.query(OfflineSales)
    returns_q = db.session.query(Return)
    
    if year:
        year_int = int(year)
        month_int = int(month)
        start_date = date(year_int, month_int, 1).strftime('%Y-%m-%d')
        end_date = date(year_int, month_int + 1, 1).strftime('%Y-%m-%d')
        sales_q = sales_q.filter(OfflineSales.date >= start_date, OfflineSales.date < end_date)
        returns_q = returns_q.filter(Return.return_date >= start_date, Return.return_date < end_date)

    sales = pd.read_sql(sales_q.statement, db.engine)
    returns = pd.read_sql(returns_q.statement, db.engine)
    
    if sales.empty:
        print("Sales empty for this period.")
    else:
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
        print(f"Leaderboard result: {leaderboard}")

        # Check if staff_name exists in User table
        for entry in leaderboard:
            u = User.query.filter_by(username=entry['staff_name']).first()
            print(f"Staff: {entry['staff_name']}, User in DB: {u is not None}")
