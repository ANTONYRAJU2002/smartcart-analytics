import pandas as pd

def clean_data(df):
    """
    Basic data cleaning function.
    """
    # Drop duplicates
    df = df.drop_duplicates()
    
    # Handle missing values (example)
    # df = df.fillna(0)
    
    return df

def preprocess_for_clustering(df):
    """
    Preprocess data for K-Means clustering.
    Aggergate by user, etc.
    """
    pass
