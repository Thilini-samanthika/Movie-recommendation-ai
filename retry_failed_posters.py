import os
import sys
import time
import requests
from sqlalchemy import create_engine, text

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
if not TMDB_API_KEY:
    print("ERROR: TMDB_API_KEY is not set. Add it to your .env file.")
    sys.exit(1)

DB_USER = os.getenv("DB_USER", "movieuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "moviepass")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "moviedb")

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

import pandas as pd
links_df = pd.read_csv('datasets/processed/links_cleaned.csv')
links_df = links_df.dropna(subset=['tmdbId'])
links_df['tmdbId'] = links_df['tmdbId'].astype(int)

with engine.connect() as connection:
    # Only movies still missing a poster after the last run
    result = connection.execute(text("SELECT id FROM movies WHERE poster_url IS NULL"))
    missing_ids = {row[0] for row in result}

target_movies = links_df[links_df['movieId'].isin(missing_ids)]
total = len(target_movies)
print(f"Retrying {total} movies that are still missing posters...")

updated = 0
still_failed = 0

with engine.connect() as connection:
    for i, row in enumerate(target_movies.itertuples(index=False), start=1):
        movie_id = int(row.movieId)
        tmdb_id = int(row.tmdbId)

        for attempt in range(3):  # retry each movie up to 3 times before giving up
            try:
                url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
                response = requests.get(url, params={"api_key": TMDB_API_KEY}, timeout=15)

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
                    break  # success, no more retries needed
                else:
                    time.sleep(1)

            except Exception as err:
                if attempt == 2:
                    still_failed += 1
                    print(f"Still failing for movie {movie_id} (tmdbId {tmdb_id}): {err}")
                time.sleep(1)

        if i % 100 == 0 or i == total:
            print(f"Progress: {i}/{total}  (updated={updated}, still_failed={still_failed})")

        time.sleep(0.05)

print(f"\nRetry done. Updated {updated} more posters, {still_failed} still failed.")