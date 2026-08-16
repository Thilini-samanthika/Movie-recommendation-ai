import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "datasets", "processed", "movie_data.csv")
CONTAINER_DATA_PATH = "/datasets/processed/movie_data.csv"
DATA_PATH = CONTAINER_DATA_PATH if os.path.exists(CONTAINER_DATA_PATH) else LOCAL_DATA_PATH



def load_data():
    movie_data = pd.read_csv(DATA_PATH)
    movie_data = movie_data.reset_index(drop=True)
    movie_data["content"] = movie_data["content"].fillna("")
    movie_data = movie_data.drop_duplicates(subset="movieId")
    movie_data = movie_data.reset_index(drop=True)
    return movie_data


def build_model(movie_data):
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(movie_data["content"])
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    indices = pd.Series(
    movie_data.index, index=movie_data["clean_title"]
)
    indices = indices[~indices.index.duplicated(keep="first")]
    return tfidf, cosine_sim, indices

movie_data = load_data()
tfidf, cosine_sim, indices = build_model(movie_data)


def recommend_movies(title, top_n=10):
    if title not in indices:
        return "Movie not found."

    idx = indices[title]
    similarity_scores = list(enumerate(cosine_sim[idx]))
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
    similarity_scores = similarity_scores[1:top_n + 1]
    movie_indices = [i[0] for i in similarity_scores]

    return movie_data[
        ["clean_title", "genres", "average_rating", "rating_count"]
    ].iloc[movie_indices]


if __name__ == "__main__":
    print(recommend_movies("Toy Story"))