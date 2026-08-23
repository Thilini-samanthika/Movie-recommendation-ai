import os
import sys
import time
import pandas as pd
import requests
from sqlalchemy import create_engine, text

# Optional: load a local .env file if python-dotenv is installed (pip install python-dotenv)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# 1. TMDB API key - MUST be set as an environment variable (.env file), never hardcoded here
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
if not TMDB_API_KEY:
    print("ERROR: TMDB_API_KEY is not set.")
    print("Create a .env file in the project root with a line like:")
    print("  TMDB_API_KEY=your_real_key_here")
    sys.exit(1)

# 2. MySQL config - MUST match import_datasets.py / docker-compose.yml
DB_USER = os.getenv("DB_USER", "movieuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "moviepass")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "moviedb")

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

print("Fetching real poster URLs from TMDB API...")

try:
    links_df = pd.read_csv('datasets/processed/links_cleaned.csv')
    links_df = links_df.dropna(subset=['tmdbId'])
    links_df['tmdbId'] = links_df['tmdbId'].astype(int)

    target_movies = links_df

    total = len(target_movies)
    updated = 0
    not_found = 0
    failed = 0

    with engine.connect() as connection:
        for i, row in enumerate(target_movies.itertuples(index=False), start=1):
            movie_id = int(row.movieId)
            tmdb_id = int(row.tmdbId)

            try:
                url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
                response = requests.get(url, params={"api_key": TMDB_API_KEY}, timeout=10)

                if response.status_code == 200:
                    data = response.json()
                    poster_path = data.get('poster_path')
                    overview = data.get('overview') or ""

                    update_query = text("""
                        UPDATE movies
                        SET poster_url = :poster_url,
                            description = :description
                        WHERE id = :movie_id
                    """)
                    connection.execute(update_query, {
                        "poster_url": f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None,
                        "description": overview if overview else None,
                        "movie_id": movie_id
                    })
                    connection.commit()

                    if poster_path:
                        updated += 1
                    else:
                        not_found += 1
                else:
                    failed += 1

            except Exception as err:
                failed += 1
                print(f"Failed for movie {movie_id} (tmdbId {tmdb_id}): {err}")

            if i % 200 == 0 or i == total:
                print(f"Progress: {i}/{total}  (updated={updated}, no_poster={not_found}, failed={failed})")

            time.sleep(0.05)  # stay well under TMDB's rate limit

    print(f"\nDone. Updated {updated} posters, {not_found} had no TMDB poster, {failed} failed.")

except Exception as e:
    print(f"Initialization Error: {e}")