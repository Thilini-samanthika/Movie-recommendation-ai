class RecommendationExplainer:
    def __init__(self, movie_data, title_col="clean_title", genre_col="genres"):
        self.movie_data = movie_data
        self.title_col = title_col
        self.genre_col = genre_col

    def explain(self, source_title, recommended_row, content_score, collaborative_score, hybrid_score):
        reasons = []

        if content_score >= 0.5:
            reasons.append(f"Strong content similarity to '{source_title}'")
        elif content_score >= 0.2:
            reasons.append(f"Shares themes with '{source_title}'")

        if collaborative_score >= 0.7:
            reasons.append("Highly rated by similar users")
        elif collaborative_score >= 0.4:
            reasons.append("Positively rated by other viewers")

        if not reasons:
            reasons.append("General pattern match")

        if hybrid_score >= 0.7:
            confidence = "High"
        elif hybrid_score >= 0.4:
            confidence = "Medium"
        else:
            confidence = "Low"

        return {
            "reasons": reasons,
            "confidence": confidence,
        }