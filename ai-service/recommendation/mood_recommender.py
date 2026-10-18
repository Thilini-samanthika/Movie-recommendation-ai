import re
import random
import pandas as pd
import numpy as np
from recommendation.hybrid_recommender import movie_data, ratings, collaborative_score

MOOD_GENRE_MAP = {
    "happy": ["comedy", "family", "children", "musical"],
    "relaxed": ["animation", "fantasy", "children", "family"],
    "excited": ["action", "adventure", "sci-fi"],
    "romantic": ["romance", "comedy"],
    "emotional": ["drama", "romance"],
    "adventurous": ["adventure", "fantasy", "action"],
    "thoughtful": ["drama", "mystery", "documentary"],
    "thrilling": ["thriller", "mystery", "crime", "horror"],
}

MOOD_DESCRIPTIONS = {
    "happy": "Uplifting, humorous, and lighthearted cinema to elevate your spirits",
    "relaxed": "Cozy, charming, and gentle stories to unwind and recharge",
    "excited": "High-octane spectacles packed with adrenaline, suspense, and daring feats",
    "romantic": "Tender connections, passion, and heartwarming romantic journeys",
    "emotional": "Deeply moving narratives exploring profound human resilience and feelings",
    "adventurous": "Epic quests, uncharted worlds, and exhilarating expeditions",
    "thoughtful": "Engrossing puzzles, introspective dramas, and thought-provoking themes",
    "thrilling": "Edge-of-your-seat suspense, tension, and dark mysterious twists",
}


def get_mood_recommendations(mood_name: str, top_n: int = 12, seed: int = None):
    normalized_mood = (mood_name or "").strip().lower()

    if normalized_mood not in MOOD_GENRE_MAP:
        return {
            "error": "Invalid mood",
            "supported_moods": list(MOOD_GENRE_MAP.keys()),
            "message": f"Mood '{mood_name}' is not recognized. Please choose from: {', '.join(MOOD_GENRE_MAP.keys())}."
        }

    target_genres = MOOD_GENRE_MAP[normalized_mood]

    pattern = "|".join(target_genres)
    matched_df = movie_data[movie_data["genres"].str.contains(pattern, case=False, na=False)].copy()

    if matched_df.empty:
        matched_df = movie_data.sort_values(by="average_rating", ascending=False).head(30).copy()

    scored_movies = []
    for _, row in matched_df.iterrows():
        movie_genre_str = str(row.get("genres", "")).lower()

        match_count = sum(1 for g in target_genres if g in movie_genre_str)
        genre_affinity = match_count / max(1, len(target_genres))


        avg_rating = row.get("average_rating")
        if pd.isna(avg_rating) or avg_rating is None:
            collab = collaborative_score(row["movieId"])
            avg_rating = collab * 5.0
        else:
            avg_rating = float(avg_rating)

        rating_affinity = min(1.0, max(0.0, avg_rating / 5.0))

        mood_score = round(genre_affinity * 0.6 + rating_affinity * 0.4, 3)


        matched_genres_list = [g.title() for g in target_genres if g in movie_genre_str]

        explanation = (
            f"Matches your '{normalized_mood.title()}' mood via {', '.join(matched_genres_list) if matched_genres_list else 'thematic alignment'} "
            f"with an average MovieLens rating of {round(avg_rating, 1)}/5."
        )

        year_val = row.get("year")
        try:
            year_int = int(year_val) if pd.notna(year_val) else None
        except (ValueError, TypeError):
            year_int = None

        scored_movies.append({
            "movieId": int(row["movieId"]),
            "title": row.get("title", row["clean_title"]),
            "clean_title": row["clean_title"],
            "genres": row["genres"],
            "year": year_int,
            "average_rating": round(avg_rating, 1),
            "mood_score": mood_score,
            "matched_genres": matched_genres_list,
            "explanation": explanation,
            "mood": normalized_mood,
            "recommendation_method": "Heuristic Mood-to-Genre Affinity Mapping",
        })

    scored_movies = sorted(scored_movies, key=lambda x: x["mood_score"], reverse=True)

    candidate_pool = scored_movies[:40]
    if seed is not None:
        random.seed(seed)
    selected = random.sample(candidate_pool, min(top_n, len(candidate_pool))) if len(candidate_pool) > top_n else candidate_pool

    selected = sorted(selected, key=lambda x: x["mood_score"], reverse=True)

    return {
        "mood": normalized_mood,
        "mood_title": normalized_mood.title(),
        "description": MOOD_DESCRIPTIONS.get(normalized_mood, ""),
        "target_genres": [g.title() for g in target_genres],
        "recommendation_method": "Heuristic Mood-to-Genre Affinity Mapping",
        "total_matches": len(matched_df),
        "recommendations": selected,
    }
