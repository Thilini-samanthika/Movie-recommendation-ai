import os
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "sentiment_model.pkl")

VECTORIZER_PATH = os.path.join(BASE_DIR, "..", "models", "sentiment_vectorizer.pkl")


model = joblib.load(MODEL_PATH)

vectorizer = joblib.load(VECTORIZER_PATH)