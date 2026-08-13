from sentiment.preprocess import clean_text
from sentiment.model import model, vectorizer


def predict_sentiment(review):

    cleaned_review = clean_text(review)

    vector = vectorizer.transform([cleaned_review])

    prediction = model.predict(vector)

    return prediction[0]

if __name__ == "__main__":

    review = "This movie is absolutely fantastic."

    result = predict_sentiment(review)

    print(result)