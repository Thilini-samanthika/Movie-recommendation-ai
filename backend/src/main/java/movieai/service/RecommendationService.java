package movieai.service;

import movieai.entity.Favorite;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.repository.FavoriteRepository;
import movieai.repository.MovieRepository;
import movieai.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecommendationService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public String getAIRecommendations(Long userId, String genre) {
        try {
            // 1. Determine seed movie title from user's favorites or high ratings or preferred genre
            String seedTitle = null;

            if (userId != null) {
                List<Favorite> userFavorites = favoriteRepository.findByUserId(userId);
                if (userFavorites != null && !userFavorites.isEmpty()) {
                    // Use the user's latest favorite movie as recommendation seed
                    seedTitle = userFavorites.get(userFavorites.size() - 1).getMovie().getTitle();
                }

                // If no favorites, allow user's highest rated reviews (rating >= 4.0) to seed recommendations
                if (seedTitle == null || seedTitle.trim().isEmpty()) {
                    List<Review> userReviews = reviewRepository.findByUserId(userId);
                    if (userReviews != null && !userReviews.isEmpty()) {
                        userReviews.stream()
                                .filter(r -> r.getRating() != null && r.getRating() >= 4.0 && !Boolean.TRUE.equals(r.getHidden()))
                                .max(Comparator.comparing(Review::getRating))
                                .ifPresent(topReview -> {
                                    if (topReview.getMovie() != null) {
                                        // seedTitle will be set from user review
                                    }
                                });
                        Review bestReview = userReviews.stream()
                                .filter(r -> r.getRating() != null && r.getRating() >= 4.0 && !Boolean.TRUE.equals(r.getHidden()))
                                .max(Comparator.comparing(Review::getRating))
                                .orElse(null);
                        if (bestReview != null && bestReview.getMovie() != null) {
                            seedTitle = bestReview.getMovie().getTitle();
                        }
                    }
                }
            }

            // Fallback: If no user favorites or high reviews, find top movie matching genre
            if (seedTitle == null || seedTitle.trim().isEmpty()) {
                String targetGenre = (genre != null && !genre.trim().isEmpty()) ? genre : "Action";
                Page<Movie> genreMovies = movieRepository.findByTitleContainingIgnoreCaseOrGenreContainingIgnoreCase(
                        "", targetGenre, PageRequest.of(0, 1)
                );
                if (genreMovies.hasContent()) {
                    seedTitle = genreMovies.getContent().get(0).getTitle();
                } else {
                    seedTitle = "Toy Story";
                }
            }

            // Clean title for AI hybrid vector model (strip trailing year if present)
            String cleanTitle = seedTitle.replaceAll("\\s*\\(\\d{4}\\)$", "").trim();

            // 2. Query Python FastAPI AI Recommendation Engine
            String targetUrl = aiServiceUrl + "/recommend";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> payload = new HashMap<>();
            payload.put("movie_title", cleanTitle);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(targetUrl, request, String.class);

            return response.getBody();

        } catch (Exception e) {
            return "{\"status\": \"error\", \"message\": \"AI Recommendation engine is currently unreachable. Make sure Python service is running.\"}";
        }
    }

    public String getMoodRecommendations(String mood) {
        try {
            String targetMood = (mood != null && !mood.trim().isEmpty()) ? mood.trim().toLowerCase() : "happy";
            String targetUrl = aiServiceUrl + "/mood-recommendations?mood=" + targetMood;
            return restTemplate.getForObject(targetUrl, String.class);
        } catch (Exception e) {
            return "{\"status\": \"error\", \"message\": \"AI mood recommendation service is currently unreachable.\"}";
        }
    }
}
