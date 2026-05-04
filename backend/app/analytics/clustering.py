from sklearn.cluster import KMeans
import pandas as pd

def perform_kmeans_clustering(data, n_clusters=3):
    """
    Groups customers based on RFM features using K-Means.
    """
    print(f"\n[AI TRAINING] Starting K-Means Cluster Training for {len(data)} customers...")
    print("[AI TRAINING] Analyzing Recency, Frequency, and Monetary patterns...")
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(data)
    
    print(f"[AI SUCCESS] Model trained! Identified {n_clusters} unique customer buckets.\n")
    return clusters
