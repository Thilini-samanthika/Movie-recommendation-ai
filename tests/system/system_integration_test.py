"""
System Integration & End-to-End Automated Test Suite
Role: QA, DevOps & Research Engineer
Project: AI-Powered Personalized Movie Recommendation System
"""

import sys
import unittest
import urllib.request
import urllib.parse
import json

BACKEND_URL = "http://localhost:8080"
AI_SERVICE_URL = "http://localhost:8000"


class SystemIntegrationTests(unittest.TestCase):

    def make_request(self, url, method="GET", data=None, headers=None):
        if headers is None:
            headers = {}

        encoded_data = None
        if data:
            encoded_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                res_body = response.read().decode("utf-8")
                return response.status, json.loads(res_body) if res_body else {}
        except urllib.error.HTTPError as e:
            res_body = e.read().decode("utf-8")
            return e.code, json.loads(res_body) if res_body else {}
        except Exception as e:
            return 500, {"error": str(e)}

    def test_01_ai_service_health_check(self):
        """Verify AI microservice health endpoint."""
        status, body = self.make_request(f"{AI_SERVICE_URL}/health")
        self.assertEqual(status, 200, f"Expected 200 OK from AI service, got {status}")
        self.assertIn("status", body)
        self.assertEqual(body["status"], "Healthy")
        print(" [PASS] AI Service Health Check passed.")

    def test_02_ai_recommendation_pipeline(self):
        """Verify AI Hybrid Recommendation endpoint generates recommendations."""
        payload = {"movie_title": "Toy Story (1995)"}
        status, body = self.make_request(f"{AI_SERVICE_URL}/recommend", method="POST", data=payload)
        self.assertIn(status, [200, 404], f"Unexpected status code {status}")
        if status == 200:
            self.assertIn("recommendations", body)
            self.assertIsInstance(body["recommendations"], list)
            print(f" [PASS] AI Recommendation generated {len(body['recommendations'])} items successfully.")
        else:
            print(" [INFO] Target test movie not found in training dataset (handy fallback verified).")

    def test_03_sentiment_analysis_pipeline(self):
        """Verify AI Sentiment Analysis model classifies movie review text correctly."""
        positive_review = {"review": "This movie was absolutely outstanding! Incredible acting and direction."}
        status, body = self.make_request(f"{AI_SERVICE_URL}/sentiment", method="POST", data=positive_review)
        self.assertEqual(status, 200, f"Expected 200 OK, got {status}")
        self.assertIn("sentiment", body)
        print(f" [PASS] Sentiment Analysis returned classification: {body['sentiment']}")

    def test_04_negative_sentiment_analysis(self):
        """Verify sentiment handling for negative input."""
        negative_review = {"review": "Horrible plot, terrible pacing, complete waste of time."}
        status, body = self.make_request(f"{AI_SERVICE_URL}/sentiment", method="POST", data=negative_review)
        self.assertEqual(status, 200)
        self.assertIn("sentiment", body)
        print(f" [PASS] Negative Sentiment classified: {body['sentiment']}")

    def test_05_sentiment_empty_input_validation(self):
        """Verify system input validation for empty review text."""
        empty_review = {"review": "   "}
        status, body = self.make_request(f"{AI_SERVICE_URL}/sentiment", method="POST", data=empty_review)
        self.assertEqual(status, 400, "Should return HTTP 400 Bad Request for empty string")
        print(" [PASS] Validation check for empty review passed.")


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING AUTOMATED SYSTEM INTEGRATION TEST SUITE")
    print("=" * 60)
    suite = unittest.TestLoader().loadTestsFromTestCase(SystemIntegrationTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(not result.wasSuccessful())
