"""
Locust Performance & Load Testing Suite
Role: QA, DevOps & Performance Engineer
"""

from locust import HttpUser, task, between
import random


class MovieSystemUser(HttpUser):
    wait_time = between(1, 3)

    sample_movies = [
        "Toy Story (1995)",
        "Jumanji (1995)",
        "Grumpier Old Men (1995)",
        "Waiting to Exhale (1995)",
        "Heat (1995)"
    ]

    sample_reviews = [
        "An absolute masterpiece of modern cinema!",
        "Poor character development and slow pacing.",
        "Loved the visual graphics and soundtrack.",
        "Average movie, nothing spectacular but entertaining."
    ]

    @task(3)
    def check_health(self):
        self.client.get("/health", name="01_AI_Health_Check")

    @task(5)
    def request_recommendations(self):
        movie = random.choice(self.sample_movies)
        self.client.post(
            "/recommend",
            json={"movie_title": movie},
            name="02_AI_Recommendation"
        )

    @task(4)
    def analyze_sentiment(self):
        review = random.choice(self.sample_reviews)
        self.client.post(
            "/sentiment",
            json={"review": review},
            name="03_AI_Sentiment_Analysis"
        )
