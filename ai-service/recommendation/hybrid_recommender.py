import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIE_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "datasets", "processed", "movie_data.csv")
RATINGS_PATH = os.path.join(BASE_DIR, "..", "..", "datasets", "raw", "movielens", "ratings.csv")


def load_data():
    movie_data = pd.read_csv(MOVIE_DATA_PATH)
    movie_data["content"] = movie_data["content"].fillna("")
    movie_data = movie_data.drop_duplicates(subset="movieId")
    movie_data = movie_data.reset_index(drop=True)

    ratings = pd.read_csv(RATINGS_PATH)

    return movie_data, ratings


def build_model(movie_data):
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(movie_data["content"])
    content_similarity = cosine_similarity(tfidf_matrix, tfidf_matrix)

    movie_indices = pd.Series(
        movie_data.index, index=movie_data["clean_title"]
    )
    movie_indices = movie_indices[~movie_indices.index.duplicated(keep="first")]

    return content_similarity, movie_indices


# Load once when this module is imported
movie_data, ratings = load_data()
content_similarity, movie_indices = build_model(movie_data)


def get_content_scores(title):
    idx = movie_indices[title]
    scores = list(enumerate(content_similarity[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    return scores


def collaborative_score(movie_id):
    avg_rating = ratings[ratings["movieId"] == movie_id]["rating"].mean()
    if np.isnan(avg_rating):
        return 0
    return avg_rating / 5


def hybrid_recommendation(title, top_n=10):
    if title not in movie_indices:
        return "Movie not found."

    scores = get_content_scores(title)

    recommendations = []

    for index, similarity in scores[1:100]:
        movie = movie_data.iloc[index]
        collab = collaborative_score(movie["movieId"])
        hybrid = similarity * 0.7 + collab * 0.3

        recommendations.append([
            movie["clean_title"],
            movie["genres"],
            round(float(similarity), 3),
            round(float(collab), 3),
            round(float(hybrid), 3)
        ])

    recommendations = sorted(recommendations, key=lambda x: x[4], reverse=True)

    return pd.DataFrame(
        recommendations[:top_n],
        columns=["clean_title", "genres", "content_score", "collaborative_score", "hybrid_score"]
    )


if __name__ == "__main__":
    print(hybrid_recommendation("Toy Story"))