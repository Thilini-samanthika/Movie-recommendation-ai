package movieai.controller;

import movieai.dto.ReviewDto;
import movieai.dto.ReviewRequest;
import movieai.dto.ReviewStatsDto;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.entity.User;
import movieai.repository.MovieRepository;
import movieai.repository.ReviewRepository;
import movieai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    private String sanitize(String input) {
        if (input == null) return null;
        // Strip HTML tags to prevent stored XSS attacks
        String clean = input.replaceAll("<[^>]*>", "").trim();
        if (clean.length() > 1000) {
            clean = clean.substring(0, 1000);
        }
        return clean;
    }

    private ReviewDto toDto(Review r) {
        return ReviewDto.builder()
                .id(r.getId())
                .movieId(r.getMovie().getId())
                .movieTitle(r.getMovie().getTitle())
                .userId(r.getUser().getId())
                .username(r.getUser().getUsername())
                .rating(r.getRating())
                .comment(r.getComment())
                .reported(r.getReported())
                .hidden(r.getHidden())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    // 1. Submit or Upsert Review & Rating for a Movie
    @PostMapping
    public ResponseEntity<?> addOrUpdateReview(@RequestBody ReviewRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required to review movies"));
        }

        if (request.getMovieId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Movie ID is required"));
        }

        if (request.getRating() == null || request.getRating() < 1.0 || request.getRating() > 5.0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1.0 and 5.0 stars"));
        }

        Movie movie = movieRepository.findById(request.getMovieId()).orElse(null);
        if (movie == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Movie not found"));
        }

        String cleanComment = sanitize(request.getComment());

        // Check if user already reviewed this movie (upsert pattern prevents duplicates)
        Review review = reviewRepository.findByUserIdAndMovieId(user.getId(), movie.getId())
                .orElse(Review.builder()
                        .user(user)
                        .movie(movie)
                        .createdAt(LocalDateTime.now())
                        .reported(false)
                        .hidden(false)
                        .build());

        review.setRating(request.getRating());
        review.setComment(cleanComment);
        review.setUpdatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        return ResponseEntity.ok(toDto(saved));
    }

    // 2. Update an Existing Review by ID (Owner only or Admin)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReview(@PathVariable Long id, @RequestBody ReviewRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Review not found"));
        }

        boolean isOwner = review.getUser().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(user.getRole());

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only edit your own reviews"));
        }

        if (request.getRating() != null) {
            if (request.getRating() < 1.0 || request.getRating() > 5.0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1.0 and 5.0 stars"));
            }
            review.setRating(request.getRating());
        }

        if (request.getComment() != null) {
            review.setComment(sanitize(request.getComment()));
        }

        review.setUpdatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);
        return ResponseEntity.ok(toDto(saved));
    }

    // 3. Delete a Review by ID (Owner or Admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Review not found"));
        }

        boolean isOwner = review.getUser().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(user.getRole());

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only delete your own reviews"));
        }

        reviewRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Review deleted successfully!", "id", id));
    }

    // 4. Get Reviews for a Movie (Paginated, Filtered for visible reviews, Sorted)
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<?> getMovieReviews(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sortBy) {

        int boundedSize = Math.max(1, Math.min(size, 50));
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");

        if ("oldest".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        } else if ("highest".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "rating");
        } else if ("lowest".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "rating");
        }

        Pageable pageable = PageRequest.of(page, boundedSize, sort);
        Page<Review> reviewPage = reviewRepository.findByMovieIdAndHiddenFalse(movieId, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", reviewPage.getContent().stream().map(this::toDto).collect(Collectors.toList()));
        response.put("currentPage", reviewPage.getNumber());
        response.put("totalElements", reviewPage.getTotalElements());
        response.put("totalPages", reviewPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    // 5. Get Aggregate Rating Statistics & Distribution for a Movie
    @GetMapping("/movie/{movieId}/stats")
    public ResponseEntity<ReviewStatsDto> getMovieReviewStats(@PathVariable Long movieId) {
        Double avgRating = reviewRepository.findAverageRatingByMovieId(movieId);
        Long count = reviewRepository.countVisibleReviewsByMovieId(movieId);

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        List<Object[]> distResults = reviewRepository.getRatingDistributionByMovieId(movieId);
        if (distResults != null) {
            for (Object[] row : distResults) {
                if (row[0] != null && row[1] != null) {
                    int star = ((Number) row[0]).intValue();
                    long cnt = ((Number) row[1]).longValue();
                    if (star >= 1 && star <= 5) {
                        distribution.put(star, cnt);
                    }
                }
            }
        }

        double normalizedAvg = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0;
        long totalReviews = count != null ? count : 0L;

        ReviewStatsDto stats = ReviewStatsDto.builder()
                .movieId(movieId)
                .averageRating(normalizedAvg)
                .totalReviews(totalReviews)
                .ratingDistribution(distribution)
                .build();

        return ResponseEntity.ok(stats);
    }

    // 6. Get Authenticated User's Review for a Movie
    @GetMapping("/movie/{movieId}/user")
    public ResponseEntity<?> getUserReviewForMovie(@PathVariable Long movieId) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.ok(null);
        }

        return reviewRepository.findByUserIdAndMovieId(user.getId(), movieId)
                .map(r -> ResponseEntity.ok(toDto(r)))
                .orElse(ResponseEntity.ok(null));
    }

    // 7. Report a Review for Moderation
    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportReview(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required to report reviews"));
        }

        return reviewRepository.findById(id).map(review -> {
            review.setReported(true);
            reviewRepository.save(review);
            return ResponseEntity.ok(Map.of("message", "Review reported to administrators for review.", "id", id));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Review not found")));
    }
}
