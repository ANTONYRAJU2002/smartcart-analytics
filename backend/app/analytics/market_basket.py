from mlxtend.frequent_patterns import apriori, association_rules
import pandas as pd

def perform_market_basket_analysis(transactions_df, min_support=0.01):
    """
    Perform Market Basket Analysis using Apriori algorithm.
    """
    # Expected format: One-hot encoded transactions
    frequent_itemsets = apriori(transactions_df, min_support=min_support, use_colnames=True)
    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1)
    return rules
