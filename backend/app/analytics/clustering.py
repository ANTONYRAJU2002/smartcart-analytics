from sklearn.cluster import KMeans
import pandas as pd

def perform_kmeans_clustering(data, n_clusters=3):
    """
    Perform K-Means clustering on the given data.
    """
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(data)
    return clusters
