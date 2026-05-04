from mlxtend.frequent_patterns import apriori, association_rules
import pandas as pd

def perform_market_basket_analysis(transactions_df, min_support=0.01):
    """
    Finds product associations using the Apriori algorithm.
    """
    print(f"\n[AI TRAINING] Scanning {len(transactions_df)} receipts for purchase patterns...")
    print("[AI TRAINING] Running Apriori algorithm to identify itemsets...")
    
    frequent_itemsets = apriori(transactions_df, min_support=min_support, use_colnames=True)
    
    if frequent_itemsets.empty:
        print("[AI INFO] No strong patterns found in current data.")
        return pd.DataFrame()
        
    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1)
    print(f"[AI SUCCESS] Discovery complete! Found {len(rules)} association rules.\n")
    return rules
