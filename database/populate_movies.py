import os
import pandas as pd
from sqlalchemy import create_engine

DB_USER = 'root'
DB_PASSWORD = ''
DB_HOST = '127.0.0.1'
DB_PORT = '3307'
DB_NAME = 'movie_ai_db'

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4")

print("Reading datasets...")
movies_df = pd.read_csv('datasets/processed/movies_cleaned.csv')


rating_map = {}
if os.path.exists('datasets/processed/movie_data.csv'):
    md = pd.read_csv('datasets/processed/movie_data.csv').drop_duplicates(subset=['movieId'])
    for _, row in md.iterrows():
        mid = int(row['movieId'])
        avg_r = row.get('average_rating')
        if pd.notna(avg_r):
            rating_map[mid] = round(float(avg_r), 1)

records = []
for _, row in movies_df.iterrows():
    mid = int(row['movieId'])
    title = str(row['title']).strip()
    genres = str(row['genres']) if pd.notna(row['genres']) else 'Drama'

    # Extract year from title
    import re
    match = re.search(r'\((\d{4})\)$', title)
    year = int(match.group(1)) if match else 2024

    avg_rating = rating_map.get(mid, 3.5)

    records.append({
        'id': mid,
        'title': title,
        'genre': genres,
        'rating': avg_rating,
        'release_year': year,
        'description': f"A cinematic work exploring themes within {genres.replace('|', ', ')}.",
        'poster_url': None
    })

db_df = pd.DataFrame(records)
print(f"Inserting {len(db_df)} movies into MySQL movie_ai_db...")

db_df.to_sql('movies', con=engine, if_exists='append', index=False, chunksize=1000)
print(f"Successfully populated {len(db_df)} movies into movie_ai_db!")
