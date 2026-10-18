import os
import re
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


    clean_series = pd.Series(
        movie_data.index, index=movie_data["clean_title"].str.strip().str.lower()
    )
    if "title" in movie_data.columns:
        raw_series = pd.Series(
            movie_data.index, index=movie_data["title"].str.strip().str.lower()
        )
        combined = pd.concat([clean_series, raw_series])
        movie_indices = combined[~combined.index.duplicated(keep="first")]
    else:
        movie_indices = clean_series[~clean_series.index.duplicated(keep="first")]

    return content_similarity, movie_indices

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

    normalized_title = title.strip().lower()

    if normalized_title not in movie_indices:

        stripped = re.sub(r"\s*\(\d{4}\)$", "", normalized_title).strip()
        if stripped in movie_indices:
            normalized_title = stripped
        else:

            candidates = [t for t in movie_indices.index if normalized_title in t or (len(t) > 3 and t in normalized_title)]
            if candidates:
                normalized_title = candidates[0]
            else:
                return "Movie not found."

    scores = get_content_scores(normalized_title)
    source_movie = movie_data.iloc[movie_indices[normalized_title]]
    source_genres = source_movie.get("genres", "")
    source_display_title = source_movie.get("clean_title", normalized_title.title())

    recommendations = []

    for index, similarity in scores[1:100]:
        movie = movie_data.iloc[index]
        collab = collaborative_score(movie["movieId"])
        hybrid = similarity * 0.7 + collab * 0.3

        explanation = explainer.explain(
            source_title=source_display_title,
            recommended_row=movie,
            content_score=float(similarity),
            collaborative_score=float(collab),
            hybrid_score=float(hybrid),
            source_genres=source_genres,
        )

        recommendations.append({
            "movieId": int(movie["movieId"]) if "movieId" in movie else index,
            "clean_title": movie["clean_title"],
            "title": movie.get("title", movie["clean_title"]),
            "genres": movie["genres"],
            "year": int(movie["year"]) if "year" in movie and pd.notna(movie["year"]) else None,
            "content_score": round(float(similarity), 3),
            "collaborative_score": round(float(collab), 3),
            "hybrid_score": round(float(hybrid), 3),
            "score": round(float(hybrid), 3),
            "reasons": explanation["reasons"],
            "confidence": explanation["confidence"],
            "explanation": explanation["explanation"],
            "matched_genres": explanation["matched_genres"],
            "contributing_factors": explanation["contributing_factors"],
            "recommendation_method": explanation["recommendation_method"],
        })

    recommendations = sorted(recommendations, key=lambda x: x["hybrid_score"], reverse=True)

    return pd.DataFrame(recommendations[:top_n])


if __name__ == "__main__":
    print(hybrid_recommendation("Toy Story"))
    print(hybrid_recommendation("toy story"))