import pandas as pd
from sqlalchemy import create_engine
import pymysql

# Database connection configuration (Docker MySQL - matches docker-compose.yml)
DB_USER = 'movieuser'
DB_PASSWORD = 'moviepass'
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'moviedb'

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

print("Starting Dataset Import Process...")

try:
    # Read processed movies dataset
    movies_csv_path = 'datasets/processed/movies_cleaned.csv'
    print(f"Reading {movies_csv_path}...")
    movies_df = pd.read_csv(movies_csv_path)

    # Rename CSV columns to match JPA entity attributes
    column_mapping = {
        'movieId': 'id',
        'title': 'title',
        'genres': 'genre',
        'rating': 'rating',
        'year': 'release_year'
    }
    movies_df = movies_df.rename(columns=column_mapping)

    # Set default values for optional missing fields
    # NOTE: leave poster_url as None (not a hardcoded image) - every movie was
    # showing the same poster because this used to default to one fixed URL.
    # Run update_posters_tmdb.py after this import to fill in real posters.
    if 'poster_url' not in movies_df.columns:
        movies_df['poster_url'] = None
    if 'description' not in movies_df.columns:
        movies_df['description'] = "Movie description curated by AI Recommendation Engine."
    if 'release_year' not in movies_df.columns:
        movies_df['release_year'] = 2024

    # Filter only matching database columns
    db_columns = ['id', 'title', 'genre', 'rating', 'release_year', 'description', 'poster_url']
    final_movies_df = movies_df[[col for col in db_columns if col in movies_df.columns]]

    # Insert records into MySQL 'movies' table
    final_movies_df.to_sql('movies', con=engine, if_exists='append', index=False, chunksize=1000)
    print(f"Successfully inserted {len(final_movies_df)} movies into MySQL database!")

    print("\nAll datasets are now connected to the Backend Database.")

except Exception as e:
    print(f"Error importing datasets: {e}")