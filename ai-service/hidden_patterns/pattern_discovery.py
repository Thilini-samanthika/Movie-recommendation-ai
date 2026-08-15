import os
import pandas as pd
import numpy as np
from itertools import combinations
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIE_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "datasets", "processed", "movie_data.csv")


def load_data():
    movie_data = pd.read_csv(MOVIE_DATA_PATH)
    movie_data["content"] = movie_data["content"].fillna("")
    movie_data = movie_data.drop_duplicates(subset="movieId").reset_index(drop=True)
    return movie_data


# ---------- 1. Genre Co-occurrence Patterns ---
def genre_cooccurrence(movie_data, top_n=15):
    """Find which genre pairs appear together most often."""
    pair_counts = Counter()
    for genres in movie_data["genres"].dropna():
        genre_list = sorted(set(genres.split()))
        for pair in combinations(genre_list, 2):
            pair_counts[pair] += 1

    top_pairs = pair_counts.most_common(top_n)
    return pd.DataFrame(top_pairs, columns=["genre_pair", "co_occurrence_count"])


# ---------- 2. Movie Clustering (Hidden Similarity Groups) ----------
def cluster_movies(movie_data, n_clusters=10, random_state=42):
    """Group movies into clusters using TF-IDF content vectors + KMeans."""
    tfidf = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = tfidf.fit_transform(movie_data["content"])

    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    cluster_labels = kmeans.fit_predict(tfidf_matrix)

    movie_data = movie_data.copy()
    movie_data["cluster"] = cluster_labels

    return movie_data, tfidf, kmeans


# ---------- 3. Cluster Themes (Top Keywords per Cluster) ----------
def get_cluster_themes(movie_data, tfidf, kmeans, top_k=8):
    """Identify the top keywords that define each cluster's theme."""
    feature_names = np.array(tfidf.get_feature_names_out())
    order_centroids = kmeans.cluster_centers_.argsort()[:, ::-1]

    themes = {}
    for cluster_id in range(kmeans.n_clusters):
        top_terms = feature_names[order_centroids[cluster_id, :top_k]]
        movies_in_cluster = movie_data[movie_data["cluster"] == cluster_id]
        sample_titles = movies_in_cluster["clean_title"].head(5).tolist()

        themes[cluster_id] = {
            "keywords": list(top_terms),
            "movie_count": len(movies_in_cluster),
            "sample_movies": sample_titles,
        }
    return themes


# ---------- 4. Similar Movie Cluster Lookup ----------
def get_cluster_for_movie(movie_data, title):
    """Return the cluster ID and cluster-mates for a given movie title."""
    match = movie_data[movie_data["clean_title"] == title]
    if match.empty:
        return "Movie not found."

    cluster_id = match.iloc[0]["cluster"]
    cluster_mates = movie_data[
        (movie_data["cluster"] == cluster_id) & (movie_data["clean_title"] != title)
    ]["clean_title"].head(10).tolist()

    return {"cluster_id": int(cluster_id), "similar_movies": cluster_mates}


def run_pattern_discovery(n_clusters=10):
    movie_data = load_data()

    genre_patterns = genre_cooccurrence(movie_data)
    clustered_data, tfidf, kmeans = cluster_movies(movie_data, n_clusters=n_clusters)
    cluster_themes = get_cluster_themes(clustered_data, tfidf, kmeans)
    preference_patterns = user_preference_patterns(movie_data)

    return {
        "genre_patterns": genre_patterns,
        "clustered_data": clustered_data,
        "cluster_themes": cluster_themes,
        "preference_patterns": preference_patterns,
    }
    # ---------- 5. User Preference Patterns ----------
def user_preference_patterns(movie_data, ratings_path=None, min_ratings=20, top_n=10):
    """Find which genres each active user segment rates highly, revealing preference clusters."""
    if ratings_path is None:
        ratings_path = os.path.join(BASE_DIR, "..", "..", "datasets", "raw", "movielens", "ratings.csv")

    ratings = pd.read_csv(ratings_path)
    merged = ratings.merge(movie_data[["movieId", "genres"]], on="movieId", how="inner")

    # Keep only users with a meaningful rating history
    user_counts = merged["userId"].value_counts()
    active_users = user_counts[user_counts >= min_ratings].index
    merged = merged[merged["userId"].isin(active_users)]

    # Expand genre strings into individual rows
    merged = merged.assign(genre=merged["genres"].str.split()).explode("genre")

    genre_avg_rating = (
        merged.groupby("genre")["rating"]
        .agg(["mean", "count"])
        .sort_values("mean", ascending=False)
        .head(top_n)
        .reset_index()
        .rename(columns={"mean": "avg_rating", "count": "num_ratings"})
    )
    genre_avg_rating["avg_rating"] = genre_avg_rating["avg_rating"].round(3)

    return genre_avg_rating


if __name__ == "__main__":
    results = run_pattern_discovery(n_clusters=10)

    print("=" * 60)
    print("TOP GENRE CO-OCCURRENCE PATTERNS")
    print("=" * 60)
    print(results["genre_patterns"])

    print("\n" + "=" * 60)
    print("CLUSTER THEMES (Hidden Movie Groups)")
    print("=" * 60)
    for cluster_id, info in results["cluster_themes"].items():
        print(f"\nCluster {cluster_id} ({info['movie_count']} movies)")
        print(f"  Keywords: {', '.join(info['keywords'])}")
        print(f"  Sample movies: {', '.join(info['sample_movies'])}")
        
    
    print("\n" + "=" * 60)
    print("USER PREFERENCE PATTERNS (Top Rated Genres by Active Users)")
    print("=" * 60)
    print(results["preference_patterns"])
