import joblib

MODEL_PATH = "models/sentiment_model.pkl"

VECTORIZER_PATH = "models/sentiment_vectorizer.pkl"


model = joblib.load(MODEL_PATH)

vectorizer = joblib.load(VECTORIZER_PATH)