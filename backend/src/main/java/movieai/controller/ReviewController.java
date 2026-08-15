package movieai.controller;

import movieai.dto.ReviewRequest;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.entity.User;
import movieai.repository.MovieRepository;
import movieai.repository.ReviewRepository;
import movieai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    // Add Review & Rating for a Movie
    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody ReviewRequest request) {
        User user = userRepository.findById(request.getUserId()).orElse(null);
        Movie movie = movieRepository.findById(request.getMovieId()).orElse(null);

        if (user == null || movie == null) {
            return ResponseEntity.badRequest().body("User or Movie not found!");
        }

        Review review = Review.builder()
                .user(user)
                .movie(movie)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        reviewRepository.save(review);
        return ResponseEntity.ok("Review added successfully!");
    }

    // Get All Reviews for a Specific Movie
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<Review>> getMovieReviews(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewRepository.findByMovieId(movieId));
    }

    // Delete a Review by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reviewRepository.deleteById(id);
        return ResponseEntity.ok("Review deleted successfully!");
    }
}
