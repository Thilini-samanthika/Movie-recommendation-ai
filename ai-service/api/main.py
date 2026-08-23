from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from recommendation.hybrid_recommender import hybrid_recommendation
from sentiment.sentiment_analyzer import predict_sentiment

app = FastAPI(
    title="Movie Recommendation AI Service",
    version="1.0.0",
    description="AI Recommendation API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendationRequest(BaseModel):
    movie_title: str


class SentimentRequest(BaseModel):
    review: str


@app.get("/")
def home():
    return {
        "message": "Movie Recommendation AI Service Running"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy"
    }


@app.post("/recommend")
def recommend(request: RecommendationRequest):
    movies = hybrid_recommendation(
        request.movie_title
    )
    if isinstance(movies, str):
        raise HTTPException(
            status_code=404,
            detail=f"Movie '{request.movie_title}' not found in dataset."
        )
    return {
        "recommendations": movies.to_dict(orient="records")
    }

@app.post("/sentiment")
def sentiment(request: SentimentRequest):
    if not request.review or not request.review.strip():
        raise HTTPException(
            status_code=400,
            detail="Review text cannot be empty."
        )
    result = predict_sentiment(
        request.review
    )
    return {
        "sentiment": result
    }


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )