import pandas as pd
from sqlalchemy import create_engine
import pymysql

# Database connection configuration (XAMPP MySQL)
DB_USER = 'root'
DB_PASSWORD = ''
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'movie_ai_db'

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
    if 'poster_url' not in movies_df.columns:
        movies_df['poster_url'] = "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg"
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