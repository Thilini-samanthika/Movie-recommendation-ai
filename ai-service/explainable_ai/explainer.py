import re

class RecommendationExplainer:
    def __init__(self, movie_data, title_col="clean_title", genre_col="genres"):
        self.movie_data = movie_data
        self.title_col = title_col
        self.genre_col = genre_col

    def _extract_genres(self, genre_str):
        if not genre_str or not isinstance(genre_str, str):
            return set()
        # Handle pipe or space separated genres
        tokens = re.split(r"[|\s,]+", genre_str.strip().lower())
        return {t for t in tokens if t}

    def explain(self, source_title, recommended_row, content_score, collaborative_score, hybrid_score, source_genres=None):
        rec_genre_str = str(recommended_row.get(self.genre_col, ""))
        rec_genres = self._extract_genres(rec_genre_str)

        src_genres = set()
        if source_genres:
            if isinstance(source_genres, (set, list)):
                src_genres = {str(g).strip().lower() for g in source_genres}
            else:
                src_genres = self._extract_genres(str(source_genres))

        matched = sorted(list(src_genres.intersection(rec_genres))) if src_genres else []

        reasons = []
        if matched:
            genre_list_str = ", ".join(g.title() for g in matched)
            reasons.append(f"Shares key genre{'' if len(matched) == 1 else 's'} [{genre_list_str}] with '{source_title}'")

        content_pct = int(round(content_score * 100))
        if content_score >= 0.5:
            reasons.append(f"High plot and thematic content similarity ({content_pct}%) to '{source_title}'")
        elif content_score >= 0.2:
            reasons.append(f"Shares thematic narrative elements ({content_pct}%) with '{source_title}'")

        collab_stars = round(float(collaborative_score * 5.0), 1)
        if collaborative_score >= 0.7:
            reasons.append(f"Consistently high community rating ({collab_stars}/5) from MovieLens viewers")
        elif collaborative_score >= 0.5:
            reasons.append(f"Favorable community viewer sentiment ({collab_stars}/5)")

        if not reasons:
            reasons.append("Overall hybrid algorithmic affinity match")

        if hybrid_score >= 0.7:
            confidence = "High"
        elif hybrid_score >= 0.4:
            confidence = "Medium"
        else:
            confidence = "Moderate"

        # Generate transparent narrative
        explanation_narrative = (
            f"Recommended because it shares {f'the genres [{genre_list_str}]' if matched else 'thematic elements'} "
            f"with '{source_title}', combined with a {content_pct}% content vector match and "
            f"a {collab_stars}/5 community rating."
        )

        contributing_factors = [
            {
                "factor": "Content Vector Similarity (TF-IDF)",
                "weight": "70%",
                "score": round(float(content_score), 3),
                "contribution": round(float(content_score * 0.7), 3),
                "details": f"Cosine similarity of plot overview, keywords, and metadata to '{source_title}'",
            },
            {
                "factor": "Collaborative Community Rating",
                "weight": "30%",
                "score": round(float(collaborative_score), 3),
                "contribution": round(float(collaborative_score * 0.3), 3),
                "details": f"Normalized rating across MovieLens reviewers ({collab_stars}/5 stars)",
            },
        ]

        return {
            "reasons": reasons,
            "confidence": confidence,
            "explanation": explanation_narrative,
            "matched_genres": [g.title() for g in matched],
            "contributing_factors": contributing_factors,
            "recommendation_method": "Hybrid Recommendation (70% Content TF-IDF + 30% Collaborative Filtering)",
        }