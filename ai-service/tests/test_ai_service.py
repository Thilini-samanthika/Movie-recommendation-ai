import os
import sys
import unittest
import pandas as pd

# Add ai-service to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_SERVICE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

from recommendation.hybrid_recommender import hybrid_recommendation, movie_data
from recommendation.mood_recommender import get_mood_recommendations, MOOD_GENRE_MAP
from explainable_ai.explainer import RecommendationExplainer


class TestExplainableAI(unittest.TestCase):

    def test_explainer_matched_genres(self):
        explainer = RecommendationExplainer(movie_data)
        rec_row = {"clean_title": "Toy Story 2", "genres": "Adventure Animation Children Comedy"}

        explanation = explainer.explain(
            source_title="Toy Story",
            recommended_row=rec_row,
            content_score=0.85,
            collaborative_score=0.8,
            hybrid_score=0.835,
            source_genres="Animation Children Comedy Fantasy",
        )

        self.assertIn("explanation", explanation)
        self.assertIn("matched_genres", explanation)
        self.assertIn("Animation", explanation["matched_genres"])
        self.assertIn("Children", explanation["matched_genres"])
        self.assertIn("Comedy", explanation["matched_genres"])
        self.assertEqual(len(explanation["contributing_factors"]), 2)
        self.assertEqual(explanation["confidence"], "High")

    def test_hybrid_recommendation_structure(self):
        result = hybrid_recommendation("Toy Story", top_n=5)
        self.assertIsInstance(result, pd.DataFrame)
        self.assertFalse(result.empty)

        expected_cols = [
            "clean_title", "genres", "content_score", "collaborative_score",
            "hybrid_score", "reasons", "confidence", "explanation",
            "matched_genres", "contributing_factors", "recommendation_method"
        ]
        for col in expected_cols:
            self.assertIn(col, result.columns, f"Missing column {col} in recommendation DataFrame")

        first = result.iloc[0]
        self.assertGreaterEqual(first["content_score"], 0.0)
        self.assertLessEqual(first["content_score"], 1.0)
        self.assertGreaterEqual(first["collaborative_score"], 0.0)
        self.assertLessEqual(first["collaborative_score"], 1.0)

        # Check hybrid score weighted calculation: 0.7 * content + 0.3 * collab
        expected_hybrid = round(first["content_score"] * 0.7 + first["collaborative_score"] * 0.3, 3)
        self.assertAlmostEqual(first["hybrid_score"], expected_hybrid, places=2)

    def test_recommendations_are_real_catalog_entries(self):
        result = hybrid_recommendation("Inception", top_n=5)
        self.assertIsInstance(result, pd.DataFrame)
        all_titles = set(movie_data["clean_title"].str.lower().tolist())
        for _, row in result.iterrows():
            title = str(row["clean_title"]).lower()
            self.assertIn(title, all_titles, f"Recommended movie '{row['clean_title']}' not in real catalog")

    def test_hybrid_recommendation_unknown_movie(self):
        result = hybrid_recommendation("A Truly Nonexistent Movie XYZ 999999999")
        self.assertEqual(result, "Movie not found.")


class TestMoodRecommendations(unittest.TestCase):

    def test_all_supported_moods(self):
        for mood in MOOD_GENRE_MAP.keys():
            result = get_mood_recommendations(mood, top_n=6, seed=42)
            self.assertNotIn("error", result, f"Mood '{mood}' returned error")
            self.assertEqual(result["mood"], mood)
            self.assertTrue(len(result["recommendations"]) > 0, f"No recommendations returned for mood '{mood}'")

            rec = result["recommendations"][0]
            self.assertIn("clean_title", rec)
            self.assertIn("mood_score", rec)
            self.assertIn("explanation", rec)
            self.assertGreater(rec["mood_score"], 0.0)

    def test_different_moods_produce_different_genres(self):
        happy_res = get_mood_recommendations("happy", top_n=5)
        thrilling_res = get_mood_recommendations("thrilling", top_n=5)

        happy_genres = [r.get("genres", "").lower() for r in happy_res["recommendations"]]
        thrilling_genres = [r.get("genres", "").lower() for r in thrilling_res["recommendations"]]

        # Happy should include Comedy/Family/Animation; Thrilling should include Thriller/Horror
        happy_combined = " ".join(happy_genres)
        thrilling_combined = " ".join(thrilling_genres)

        self.assertTrue("comedy" in happy_combined or "animation" in happy_combined or "children" in happy_combined)
        self.assertTrue("thriller" in thrilling_combined or "horror" in thrilling_combined or "mystery" in thrilling_combined)


    def test_invalid_mood_handling(self):
        result = get_mood_recommendations("angry_and_grumpy")
        self.assertIn("error", result)
        self.assertIn("supported_moods", result)


if __name__ == "__main__":
    unittest.main()
