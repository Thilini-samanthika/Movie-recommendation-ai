"""
CINEMA AI — Full-Stack End-to-End Integration Test Suite
Validates all 5 implemented features against the live Docker/Local microservices:
1. Playback Progress & Continue Watching
2. Movie Ratings & Reviews
3. Explainable AI Recommendations
4. Mood-Based Recommendations
5. Enterprise Admin Panel & RBAC
"""

import sys
import unittest
import urllib.request
import urllib.parse
import json
import time

BACKEND_URL = "http://localhost:8090"
AI_SERVICE_URL = "http://localhost:8000"


class CinemaAIFeaturesIntegrationTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.timestamp = int(time.time())
        cls.test_user = f"viewer_{cls.timestamp}"
        cls.test_pass = "Password123!"
        cls.test_email = f"viewer_{cls.timestamp}@cinema.ai"
        cls.auth_token = None

        # User 2 for isolation testing
        cls.other_user = f"isolated_{cls.timestamp}"
        cls.other_pass = "Password123!"
        cls.other_email = f"isolated_{cls.timestamp}@cinema.ai"
        cls.other_token = None

    def request(self, url, method="GET", data=None, token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8")
                try:
                    parsed = json.loads(body)
                except Exception:
                    parsed = {"message": body}
                return resp.status, parsed
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = {"raw": body}
            return e.code, parsed
        except Exception as e:
            return 500, {"error": str(e)}

    # ---------------------------------------------------------
    # FEATURE 3: EXPLAINABLE AI RECOMMENDATIONS
    # ---------------------------------------------------------
    def test_01_explainable_ai_recommendations(self):
        """Verify Explainable AI endpoint provides decomposition and matched genres."""
        payload = {"movie_title": "Toy Story"}
        status, body = self.request(f"{AI_SERVICE_URL}/recommend", method="POST", data=payload)
        self.assertEqual(status, 200, f"Expected 200 from /recommend, got {status}: {body}")
        self.assertIn("recommendations", body)
        recs = body["recommendations"]
        self.assertGreater(len(recs), 0)

        first = recs[0]
        self.assertIn("clean_title", first)
        self.assertIn("content_score", first)
        self.assertIn("collaborative_score", first)
        self.assertIn("hybrid_score", first)
        self.assertIn("explanation", first)
        self.assertIn("matched_genres", first)
        self.assertIn("contributing_factors", first)
        self.assertIn("confidence", first)

        print(f" [PASS] Explainable AI: Recommended '{first['clean_title']}' with score {first['hybrid_score']}")
        print(f"        Explanation: {first['explanation']}")
        print(f"        Matched Genres: {first['matched_genres']}")

    # ---------------------------------------------------------
    # FEATURE 4: MOOD-BASED RECOMMENDATIONS
    # ---------------------------------------------------------
    def test_02_mood_based_recommendations(self):
        """Verify Mood-Based Discovery supports all curated mood archetypes."""
        moods_to_test = ["happy", "thrilling", "excited", "romantic"]
        for mood in moods_to_test:
            status, body = self.request(f"{AI_SERVICE_URL}/mood-recommendations?mood={mood}&limit=4")
            self.assertEqual(status, 200, f"Failed for mood '{mood}': {body}")
            self.assertEqual(body.get("mood"), mood)
            self.assertIn("recommendations", body)
            self.assertGreater(len(body["recommendations"]), 0)
            sample_rec = body["recommendations"][0]
            self.assertIn("clean_title", sample_rec)
            self.assertIn("explanation", sample_rec)

        print(f" [PASS] Mood-Based Recommendations verified for {len(moods_to_test)} moods.")

    def test_03_invalid_mood_handling(self):
        """Verify invalid mood returns 400 Bad Request with supported moods list."""
        status, body = self.request(f"{AI_SERVICE_URL}/mood-recommendations?mood=unknown_mood")
        self.assertEqual(status, 400)
        detail = body.get("detail", "")
        self.assertTrue("choose from:" in detail or "supported_moods" in detail)
        print(" [PASS] Invalid mood gracefully rejected with supported moods list.")

    # ---------------------------------------------------------
    # AUTHENTICATION & SESSION PERSISTENCE
    # ---------------------------------------------------------
    def test_04_user_registration_and_jwt_login(self):
        """Register test users and obtain JWT tokens for authenticated feature verification."""
        # Register User 1
        reg_payload = {
            "username": self.test_user,
            "password": self.test_pass,
            "email": self.test_email,
        }
        status, body = self.request(f"{BACKEND_URL}/api/auth/register", method="POST", data=reg_payload)
        self.assertIn(status, [200, 201], f"Register failed: {body}")

        # Login User 1
        login_payload = {
            "username": self.test_user,
            "password": self.test_pass,
        }
        status, body = self.request(f"{BACKEND_URL}/api/auth/login", method="POST", data=login_payload)
        self.assertEqual(status, 200, f"Login failed: {body}")
        self.__class__.auth_token = body.get("token") or body.get("jwt")
        self.assertIsNotNone(self.auth_token, "Expected valid JWT token")

        # Register User 2 (for isolation testing)
        reg_payload_2 = {
            "username": self.other_user,
            "password": self.other_pass,
            "email": self.other_email,
        }
        self.request(f"{BACKEND_URL}/api/auth/register", method="POST", data=reg_payload_2)
        status, body = self.request(f"{BACKEND_URL}/api/auth/login", method="POST", data={"username": self.other_user, "password": self.other_pass})
        self.__class__.other_token = body.get("token") or body.get("jwt")

        print(f" [PASS] Authenticated 2 test users successfully. JWT obtained.")

    # ---------------------------------------------------------
    # FEATURE 1: PLAYBACK PROGRESS & CONTINUE WATCHING
    # ---------------------------------------------------------
    def test_05_save_and_retrieve_playback_progress(self):
        """Save playback progress, retrieve continue watching, verify position & percent."""
        if not self.auth_token:
            self.skipTest("No auth token")

        progress_payload = {
            "positionSeconds": 372.5,
            "durationSeconds": 888.0,
            "completed": False,
        }
        # Save progress for Sintel
        status, body = self.request(
            f"{BACKEND_URL}/api/playback-progress/sintel",
            method="PUT",
            data=progress_payload,
            token=self.auth_token,
        )
        self.assertEqual(status, 200, f"Failed to save playback progress: {body}")
        self.assertEqual(body.get("filmId"), "sintel")
        self.assertAlmostEqual(body.get("positionSeconds"), 372.5, delta=1.0)
        self.assertAlmostEqual(body.get("progressPercentage"), 41.9, delta=0.5)

        # Retrieve user's continue watching list
        status, list_body = self.request(
            f"{BACKEND_URL}/api/playback-progress",
            method="GET",
            token=self.auth_token,
        )
        self.assertEqual(status, 200)
        self.assertIsInstance(list_body, list)
        self.assertTrue(any(item["filmId"] == "sintel" for item in list_body))

        print(f" [PASS] Playback Progress: Saved Sintel at 372.5s (41.9%). Successfully retrieved.")

    def test_06_playback_progress_cross_user_isolation(self):
        """Ensure other users cannot see User 1's saved playback progress."""
        if not self.other_token:
            self.skipTest("No other token")

        # User 2 requests continue watching
        status, list_body = self.request(
            f"{BACKEND_URL}/api/playback-progress",
            method="GET",
            token=self.other_token,
        )
        self.assertEqual(status, 200)
        # Sintel progress from User 1 must NOT be visible to User 2
        user_2_films = [item["filmId"] for item in list_body]
        self.assertNotIn("sintel", user_2_films, "Cross-user data leakage detected!")

        print(" [PASS] Cross-user isolation verified: Playback progress strictly isolated.")

    # ---------------------------------------------------------
    # FEATURE 2: MOVIE RATINGS & REVIEWS
    # ---------------------------------------------------------
    def test_07_movie_review_crud_workflow(self):
        """Submit a rating & review, verify stats update, edit review, and delete review."""
        if not self.auth_token:
            self.skipTest("No auth token")

        # 1. Post new review for Movie #1
        review_payload = {
            "movieId": 1,
            "rating": 5.0,
            "comment": "Outstanding animation classic! Great pacing and heartwarming story.",
        }
        status, body = self.request(
            f"{BACKEND_URL}/api/reviews",
            method="POST",
            data=review_payload,
            token=self.auth_token,
        )
        self.assertEqual(status, 200, f"Failed to post review: {body}")
        review_id = body.get("id")
        self.assertIsNotNone(review_id)
        self.assertEqual(body.get("rating"), 5.0)

        # 2. Get review stats for Movie #1
        status, stats = self.request(f"{BACKEND_URL}/api/reviews/movie/1/stats", method="GET")
        self.assertEqual(status, 200, f"Stats failed: {stats}")
        self.assertGreater(stats.get("totalReviews", 0), 0)

        # 3. Update the review
        update_payload = {
            "movieId": 1,
            "rating": 4.5,
            "comment": "Updated review: Still an absolute masterpiece of early CGI.",
        }
        status, updated = self.request(
            f"{BACKEND_URL}/api/reviews/{review_id}",
            method="PUT",
            data=update_payload,
            token=self.auth_token,
        )
        self.assertEqual(status, 200)
        self.assertEqual(updated.get("rating"), 4.5)

        # 4. Delete the review
        status, del_resp = self.request(
            f"{BACKEND_URL}/api/reviews/{review_id}",
            method="DELETE",
            token=self.auth_token,
        )
        self.assertEqual(status, 200)

        print(" [PASS] Movie Ratings & Reviews: Full CRUD cycle and aggregate stats verified.")

    # ---------------------------------------------------------
    # FEATURE 5: ENTERPRISE ADMIN PANEL & RBAC
    # ---------------------------------------------------------
    def test_08_admin_rbac_rejection_for_regular_user(self):
        """Verify non-admin users cannot access admin endpoints (HTTP 403 Forbidden)."""
        if not self.auth_token:
            self.skipTest("No auth token")

        status, body = self.request(f"{BACKEND_URL}/api/admin/stats", method="GET", token=self.auth_token)
        self.assertEqual(status, 403, f"Regular user should receive 403 Forbidden, got {status}")
        print(" [PASS] Security: Regular user denied access to /api/admin/stats (HTTP 403).")


if __name__ == "__main__":
    print("=" * 70)
    print("CINEMA AI — END-TO-END FEATURE INTEGRATION VERIFICATION")
    print("=" * 70)
    suite = unittest.TestLoader().loadTestsFromTestCase(CinemaAIFeaturesIntegrationTest)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(not result.wasSuccessful())
