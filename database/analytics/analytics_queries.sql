USE movieaidb;

CREATE INDEX idx_movie_title ON movies(movie_id);
CREATE INDEX idx_rating_movie ON ratings(movieId);
CREATE INDEX idx_rating_user ON ratings(userId);

SELECT m.title, AVG(r.rating) AS avg_rating, COUNT(r.rating) AS total_reviews
FROM movies m
JOIN ratings r ON m.movie_id = r.movieId
GROUP BY m.movie_id, m.title
HAVING total_reviews > 20
ORDER BY avg_rating DESC
LIMIT 10;

SELECT genres, COUNT(*) AS total_movies 
FROM movies 
GROUP BY genres 
ORDER BY total_movies DESC 
LIMIT 10;