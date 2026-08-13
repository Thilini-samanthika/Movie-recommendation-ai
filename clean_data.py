import os
import pandas as pd

print("Loading raw datasets from datasets/raw/movielens/...")


RAW_DIR = os.path.join('datasets', 'raw', 'movielens')
PROCESSED_DIR = os.path.join('datasets', 'processed')


os.makedirs(PROCESSED_DIR, exist_ok=True)


movies = pd.read_csv(os.path.join(RAW_DIR, 'movies.csv'))
ratings = pd.read_csv(os.path.join(RAW_DIR, 'ratings.csv'))
links = pd.read_csv(os.path.join(RAW_DIR, 'links.csv'))
tags = pd.read_csv(os.path.join(RAW_DIR, 'tags.csv'))

print("Cleaning datasets...")


movies = movies.dropna().drop_duplicates(subset=['movieId'])
movies['movieId'] = movies['movieId'].astype(int)


ratings = ratings.dropna().drop_duplicates()
ratings['userId'] = ratings['userId'].astype(int)
ratings['movieId'] = ratings['movieId'].astype(int)
ratings['rating'] = ratings['rating'].astype(float)


links = links.dropna().drop_duplicates(subset=['movieId'])
links['movieId'] = links['movieId'].astype(int)
links['imdbId'] = links['imdbId'].astype(int)
links['tmdbId'] = links['tmdbId'].astype(int)


tags = tags.dropna().drop_duplicates()
tags['userId'] = tags['userId'].astype(int)
tags['movieId'] = tags['movieId'].astype(int)
tags['tag'] = tags['tag'].astype(str)


movies.to_csv(os.path.join(PROCESSED_DIR, 'movies_cleaned.csv'), index=False)
ratings.to_csv(os.path.join(PROCESSED_DIR, 'ratings_cleaned.csv'), index=False)
links.to_csv(os.path.join(PROCESSED_DIR, 'links_cleaned.csv'), index=False)
tags.to_csv(os.path.join(PROCESSED_DIR, 'tags_cleaned.csv'), index=False)

print("Data Cleaning Complete! All 4 cleaned files are saved in 'datasets/processed/' folder.")