import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from explainable_ai.explainer import RecommendationExplainer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_MOVIE_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "datasets", "processed", "movie_data.csv")
CONTAINER_MOVIE_DATA_PATH = "/datasets/processed/movie_data.csv"
MOVIE_DATA_PATH = CONTAINER_MOVIE_DATA_PATH if os.path.exists(CONTAINER_MOVIE_DATA_PATH) else LOCAL_MOVIE_DATA_PATH

LOCAL_RATINGS_PATH = os.path.join(BASE_DIR, "..", "..", "datasets", "raw", "movielens", "ratings.csv")
CONTAINER_RATINGS_PATH = "/datasets/raw/movielens/ratings.csv"
RATINGS_PATH = CONTAINER_RATINGS_PATH if os.path.exists(CONTAINER_RATINGS_PATH) else LOCAL_RATINGS_PATH



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

    # Normalize titles (trim + lowercase) so lookups aren't case/whitespace sensitive
    movie_indices = pd.Series(
        movie_data.index, index=movie_data["clean_title"].str.strip().str.lower()
    )
    movie_indices = movie_indices[~movie_indices.index.duplicated(keep="first")]

    return content_similarity, movie_indices


# Load once when this module is imported
movie_data, ratings = load_data()
content_similarity, movie_indices = build_model(movie_data)
explainer = RecommendationExplainer(
    movie_data,
    title_col="clean_title",
    genre_col="genres",
)


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
    # Normalize the incoming title the same way the index was built,
    # so "toy story", "Toy Story", " Toy Story " all match correctly.
    normalized_title = title.strip().lower()

    if normalized_title not in movie_indices:
        return "Movie not found."

    scores = get_content_scores(normalized_title)

    recommendations = []

    for index, similarity in scores[1:100]:
        movie = movie_data.iloc[index]
        collab = collaborative_score(movie["movieId"])
        hybrid = similarity * 0.7 + collab * 0.3

        explanation = explainer.explain(
            source_title=normalized_title,
            recommended_row=movie,
            content_score=float(similarity),
            collaborative_score=float(collab),
            hybrid_score=float(hybrid),
        )

        recommendations.append([
            movie["clean_title"],
            movie["genres"],
            round(float(similarity), 3),
            round(float(collab), 3),
            round(float(hybrid), 3),
            explanation["reasons"],
            explanation["confidence"],
        ])

    recommendations = sorted(recommendations, key=lambda x: x[4], reverse=True)

    return pd.DataFrame(
        recommendations[:top_n],
        columns=["clean_title", "genres", "content_score", "collaborative_score", "hybrid_score", "reasons", "confidence"]
    )


if __name__ == "__main__":
    print(hybrid_recommendation("Toy Story"))
    print(hybrid_recommendation("toy story"))  # case-insensitive test