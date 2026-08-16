import pandas as pd
import requests
import pymysql
from sqlalchemy import create_engine, text
import time

# 1. Paste your TMDB API Key here
TMDB_API_KEY = "e22a0d97f59d92797112e0efd671bf72"

# 2. MySQL Database Configuration
DB_USER = 'root'
DB_PASSWORD = ''
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'movie_ai_db'

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

print("Fetching real poster URLs from TMDB API...")

# 3. Read links.csv
try:
    links_df = pd.read_csv('datasets/processed/links_cleaned.csv')
    links_df = links_df.dropna(subset=['tmdbId'])
    links_df['tmdbId'] = links_df['tmdbId'].astype(int)
    
    # Selecting the first 200 movies to prevent API rate limiting
    target_movies = links_df.head(200)

    with engine.connect() as connection:
        for _, row in target_movies.iterrows():
            movie_id = int(row['movieId'])
            tmdb_id = int(row['tmdbId'])
            
            try:
                url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={TMDB_API_KEY}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    poster_path = data.get('poster_path')
                    
                    if poster_path:
                        full_poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
                        overview = data.get('overview', '').replace("'", "''")
                        
                        update_query = text(f"""
                            UPDATE movies 
                            SET poster_url = '{full_poster_url}', 
                                description = '{overview}' 
                            WHERE id = {movie_id}
                        """)
                        connection.execute(update_query)
                        connection.commit()
                        print(f"Updated Movie ID {movie_id} -> {data.get('title')}")
                
                time.sleep(0.1) # Small delay to respect TMDB rate limits
                
            except Exception as err:
                print(f"Failed for movie {movie_id}: {err}")

    print("Successfully updated posters from TMDB!")

except Exception as e:
    print(f"Initialization Error: {e}")