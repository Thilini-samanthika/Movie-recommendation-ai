package movieai.controller;

import movieai.entity.Movie;
import movieai.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieRepository movieRepository;

    // Fetch all movies with Pagination, Filtering, and Sorting
    @GetMapping
    public ResponseEntity<Page<Movie>> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "id_asc") String sortBy) {

        Sort sort = switch (sortBy) {
            case "rating_desc" -> Sort.by(Sort.Direction.DESC, "rating");
            case "year_desc" -> Sort.by(Sort.Direction.DESC, "releaseYear");
            case "year_asc" -> Sort.by(Sort.Direction.ASC, "releaseYear");
            case "title_asc" -> Sort.by(Sort.Direction.ASC, "title");
            case "title_desc" -> Sort.by(Sort.Direction.DESC, "title");
            default -> Sort.by(Sort.Direction.ASC, "id");
        };

        PageRequest pageRequest = PageRequest.of(page, size, sort);

        boolean hasFilters = (query != null && !query.trim().isEmpty())
                || (genre != null && !genre.trim().isEmpty() && !"All".equalsIgnoreCase(genre))
                || year != null
                || minRating != null;

        if (hasFilters) {
            return ResponseEntity.ok(movieRepository.filterMovies(query, genre, year, minRating, pageRequest));
        }

        return ResponseEntity.ok(movieRepository.findAll(pageRequest));
    }

    // Get single movie details
    @GetMapping("/{id}")
    public ResponseEntity<?> getMovieById(@PathVariable Long id) {
        return movieRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Search movies by title or genre (backwards compatibility)
    @GetMapping("/search")
    public ResponseEntity<Page<Movie>> searchMovies(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                movieRepository.findByTitleContainingIgnoreCaseOrGenreContainingIgnoreCase(query, query, PageRequest.of(page, size))
        );
    }

    @Autowired
    private ReviewController reviewController;

    // GET /api/movies/{movieId}/reviews
    @GetMapping("/{movieId}/reviews")
    public ResponseEntity<?> getMovieReviews(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sortBy) {
        return reviewController.getMovieReviews(movieId, page, size, sortBy);
    }

    // GET /api/movies/{movieId}/rating-summary
    @GetMapping("/{movieId}/rating-summary")
    public ResponseEntity<?> getMovieRatingSummary(@PathVariable Long movieId) {
        return reviewController.getMovieReviewStats(movieId);
    }

    // POST /api/movies/{movieId}/reviews
    @PostMapping("/{movieId}/reviews")
    public ResponseEntity<?> addMovieReview(
            @PathVariable Long movieId,
            @RequestBody movieai.dto.ReviewRequest request) {
        request.setMovieId(movieId);
        return reviewController.addOrUpdateReview(request);
    }
}
