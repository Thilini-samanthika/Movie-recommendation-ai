import os
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine('mysql+pymysql://movieuser:moviepass@localhost:3306/moviedb')

file_path = os.path.join('datasets', 'processed', 'ratings_cleaned.csv')

print("Loading ratings_cleaned.csv...")
ratings = pd.read_csv(file_path)

print("Importing into MySQL database... Please wait a few seconds.")

ratings.to_sql('ratings', con=engine, if_exists='replace', index=False)

print("Successfully imported all ratings into MySQL Database!")