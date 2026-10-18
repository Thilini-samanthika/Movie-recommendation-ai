package movieai.controller;

import movieai.dto.UserProfileDto;
import movieai.entity.AdminAuditLog;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.entity.User;
import movieai.repository.*;
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
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    private User getAuthenticatedAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    private void logAdminAction(String action, String targetEntity, Long targetId, String details) {
        User admin = getAuthenticatedAdmin();
        String adminUsername = admin != null ? admin.getUsername() : "SYSTEM_ADMIN";
        AdminAuditLog log = AdminAuditLog.builder()
                .adminUsername(adminUsername)
                .action(action)
                .targetEntity(targetEntity)
                .targetId(targetId)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    private UserProfileDto toUserProfileDto(User u) {
        return UserProfileDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .active(u.getActive() != null ? u.getActive() : true)
                .createdAt(u.getCreatedAt())
                .build();
    }

    // ==========================================
    // 1. OVERALL SYSTEM TELEMETRY & STATS
    // ==========================================
    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMovies", movieRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("activeUsers", userRepository.countByActiveTrue());
        stats.put("inactiveUsers", userRepository.countByActiveFalse());
        stats.put("totalFavorites", favoriteRepository.count());
        stats.put("totalWatchlist", watchlistRepository.count());
        stats.put("totalReviews", reviewRepository.count());
        stats.put("reportedReviews", reviewRepository.countByReportedTrue());
        stats.put("hiddenReviews", reviewRepository.countByHiddenTrue());
        stats.put("totalLegalFilms", StreamingController.getAllFilms().size());
        stats.put("systemStatus", "Healthy / Operational");
        return ResponseEntity.ok(stats);
    }

    @Autowired(required = false)
    private org.springframework.web.client.RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    // Real System Health for Spring Boot, MySQL, and FastAPI AI service
    @GetMapping("/health")
    public ResponseEntity<?> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("backend", "UP");

        try {
            userRepository.count();
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
        }

        try {
            org.springframework.web.client.RestTemplate rt = restTemplate != null ? restTemplate : new org.springframework.web.client.RestTemplate();
            Map<?, ?> aiRes = rt.getForObject(aiServiceUrl + "/health", Map.class);
            if (aiRes != null && "Healthy".equalsIgnoreCase(String.valueOf(aiRes.get("status")))) {
                health.put("aiService", "UP");
            } else {
                health.put("aiService", "DEGRADED");
            }
        } catch (Exception e) {
            health.put("aiService", "DOWN");
        }

        health.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(health);
    }

    // ==========================================
    // 2. USER REGISTRY & ROLE / STATUS MANAGEMENT
    // ==========================================
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        int boundedSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, boundedSize, Sort.by(Sort.Direction.ASC, "id"));

        Page<User> userPage = userRepository.searchUsers(query, role, pageable);
        List<UserProfileDto> dtos = userPage.getContent().stream()
                .map(this::toUserProfileDto)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("users", dtos);
        response.put("currentPage", userPage.getNumber());
        response.put("totalElements", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        Boolean newStatus = (Boolean) payload.get("active");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "'active' boolean is required"));
        }

        // Prevent accidental deactivation of the last active administrator
        if (!newStatus && "ROLE_ADMIN".equals(target.getRole())) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue("ROLE_ADMIN");
            if (activeAdmins <= 1) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot deactivate the last active administrator account."
                ));
            }
        }

        target.setActive(newStatus);
        userRepository.save(target);

        logAdminAction(
                "USER_STATUS_CHANGE",
                "USER",
                id,
                "Changed status for @" + target.getUsername() + " to " + (newStatus ? "ACTIVE" : "SUSPENDED")
        );

        return ResponseEntity.ok(toUserProfileDto(target));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User target = userRepository.findById(id).orElse(null);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        String newRole = payload.get("role");
        if (!"ROLE_USER".equals(newRole) && !"ROLE_ADMIN".equals(newRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role. Supported: ROLE_USER, ROLE_ADMIN"));
        }

        // Prevent demoting the last active administrator
        if ("ROLE_USER".equals(newRole) && "ROLE_ADMIN".equals(target.getRole())) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue("ROLE_ADMIN");
            if (activeAdmins <= 1) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot remove administrator privileges from the last active administrator."
                ));
            }
        }

        target.setRole(newRole);
        userRepository.save(target);

        logAdminAction(
                "USER_ROLE_CHANGE",
                "USER",
                id,
                "Assigned role " + newRole + " to @" + target.getUsername()
        );

        return ResponseEntity.ok(toUserProfileDto(target));
    }

    // ==========================================
    // 3. MOVIE CATALOG MANAGEMENT
    // ==========================================
    @GetMapping("/movies")
    public ResponseEntity<?> getMovies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String genre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        int boundedSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, boundedSize, Sort.by(Sort.Direction.DESC, "id"));

        Page<Movie> moviePage = movieRepository.filterMovies(search, genre, null, null, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("movies", moviePage.getContent());
        response.put("currentPage", moviePage.getNumber());
        response.put("totalElements", moviePage.getTotalElements());
        response.put("totalPages", moviePage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/movies")
    public ResponseEntity<?> addMovie(@RequestBody Movie movie) {
        if (movie.getTitle() == null || movie.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Movie title is required"));
        }

        if (movie.getRating() != null && (movie.getRating() < 0.0 || movie.getRating() > 5.0)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 0.0 and 5.0"));
        }

        Movie savedMovie = movieRepository.save(movie);
        logAdminAction("MOVIE_CREATE", "MOVIE", savedMovie.getId(), "Added movie: " + savedMovie.getTitle());
        return ResponseEntity.ok(savedMovie);
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<?> updateMovie(@PathVariable Long id, @RequestBody Movie updated) {
        return movieRepository.findById(id).map(existing -> {
            if (updated.getTitle() != null && !updated.getTitle().trim().isEmpty()) existing.setTitle(updated.getTitle().trim());
            if (updated.getGenre() != null) existing.setGenre(updated.getGenre().trim());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription().trim());
            if (updated.getRating() != null) existing.setRating(updated.getRating());
            if (updated.getReleaseYear() != null) existing.setReleaseYear(updated.getReleaseYear());
            if (updated.getPosterUrl() != null) existing.setPosterUrl(updated.getPosterUrl().trim());

            Movie saved = movieRepository.save(existing);
            logAdminAction("MOVIE_UPDATE", "MOVIE", id, "Updated metadata for: " + saved.getTitle());
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<?> deleteMovie(@PathVariable Long id) {
        Movie movie = movieRepository.findById(id).orElse(null);
        if (movie == null) {
            return ResponseEntity.notFound().build();
        }

        movieRepository.deleteById(id);
        logAdminAction("MOVIE_DELETE", "MOVIE", id, "Deleted movie record: " + movie.getTitle());
        return ResponseEntity.ok(Map.of("message", "Movie deleted successfully!", "id", id));
    }

    // ==========================================
    // 4. REVIEW MODERATION
    // ==========================================
    @GetMapping("/reviews")
    public ResponseEntity<?> getReviewsForModeration(
            @RequestParam(defaultValue = "all") String filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        int boundedSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(page, boundedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Review> reviewPage;
        if ("reported".equalsIgnoreCase(filter)) {
            reviewPage = reviewRepository.findByReportedTrue(pageable);
        } else if ("hidden".equalsIgnoreCase(filter)) {
            reviewPage = reviewRepository.findByHiddenTrue(pageable);
        } else {
            reviewPage = reviewRepository.findAll(pageable);
        }

        List<Map<String, Object>> content = reviewPage.getContent().stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("movieId", r.getMovie().getId());
            map.put("movieTitle", r.getMovie().getTitle());
            map.put("userId", r.getUser().getId());
            map.put("username", r.getUser().getUsername());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("reported", r.getReported());
            map.put("hidden", r.getHidden());
            map.put("createdAt", r.getCreatedAt());
            map.put("updatedAt", r.getUpdatedAt());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("reviews", content);
        response.put("currentPage", reviewPage.getNumber());
        response.put("totalElements", reviewPage.getTotalElements());
        response.put("totalPages", reviewPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/reviews/{id}/hide")
    public ResponseEntity<?> hideReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ResponseEntity.notFound().build();
        }

        review.setHidden(true);
        reviewRepository.save(review);

        logAdminAction(
                "REVIEW_HIDE",
                "REVIEW",
                id,
                "Soft-moderated/hidden review #" + id + " on film '" + review.getMovie().getTitle() + "'"
        );

        return ResponseEntity.ok(Map.of("message", "Review has been hidden from public display.", "id", id));
    }

    @PutMapping("/reviews/{id}/restore")
    public ResponseEntity<?> restoreReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ResponseEntity.notFound().build();
        }

        review.setHidden(false);
        review.setReported(false);
        reviewRepository.save(review);

        logAdminAction(
                "REVIEW_RESTORE",
                "REVIEW",
                id,
                "Restored review #" + id + " and cleared reported flag"
        );

        return ResponseEntity.ok(Map.of("message", "Review restored to public view.", "id", id));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReviewPermanently(@PathVariable Long id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ResponseEntity.notFound().build();
        }

        reviewRepository.deleteById(id);
        logAdminAction(
                "REVIEW_DELETE",
                "REVIEW",
                id,
                "Permanently purged review #" + id + " by @" + review.getUser().getUsername()
        );

        return ResponseEntity.ok(Map.of("message", "Review permanently deleted.", "id", id));
    }

    // ==========================================
    // 5. LEGAL FILM CATALOG MANAGEMENT
    // ==========================================
    @GetMapping("/legal-films")
    public ResponseEntity<?> getLegalFilms() {
        Map<String, Map<String, Object>> allFilms = StreamingController.getAllFilms();
        List<Map<String, Object>> filmList = new ArrayList<>(allFilms.values());
        return ResponseEntity.ok(filmList);
    }

    @PutMapping("/legal-films/{filmId}")
    public ResponseEntity<?> updateLegalFilm(@PathVariable String filmId, @RequestBody Map<String, Object> updates) {
        Map<String, Object> film = StreamingController.getFilm(filmId);
        if (film == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Legal film not found"));
        }

        if (updates.containsKey("description")) film.put("description", updates.get("description"));
        if (updates.containsKey("credit")) film.put("credit", updates.get("credit"));
        if (updates.containsKey("license")) film.put("license", updates.get("license"));
        if (updates.containsKey("sourceUrl")) film.put("sourceUrl", updates.get("sourceUrl"));
        if (updates.containsKey("available")) film.put("available", updates.get("available"));

        logAdminAction("LEGAL_FILM_UPDATE", "LEGAL_FILM", 0L, "Updated metadata for film: " + film.get("title"));
        return ResponseEntity.ok(film);
    }

    // ==========================================
    // 6. REAL DATABASE ANALYTICS
    // ==========================================
    @GetMapping("/analytics")
    public ResponseEntity<?> getAdminAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        // 1. Rating Distribution across all reviews
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        List<Object[]> distResults = reviewRepository.getOverallRatingDistribution();
        if (distResults != null) {
            for (Object[] row : distResults) {
                if (row[0] != null && row[1] != null) {
                    int star = ((Number) row[0]).intValue();
                    long cnt = ((Number) row[1]).longValue();
                    if (star >= 1 && star <= 5) {
                        ratingDistribution.put(star, cnt);
                    }
                }
            }
        }
        analytics.put("ratingDistribution", ratingDistribution);

        // 2. Top Favorited Movies
        List<Object[]> topFavsRaw = favoriteRepository.findTopFavoritedMovies(PageRequest.of(0, 5));
        List<Map<String, Object>> topFavorites = new ArrayList<>();
        if (topFavsRaw != null) {
            for (Object[] row : topFavsRaw) {
                Map<String, Object> item = new HashMap<>();
                item.put("movieId", row[0]);
                item.put("title", row[1]);
                item.put("genre", row[2]);
                item.put("favoriteCount", row[3]);
                topFavorites.add(item);
            }
        }
        analytics.put("topFavorites", topFavorites);

        // 3. User Role Breakdown
        Map<String, Long> userRoles = new HashMap<>();
        userRoles.put("ROLE_USER", userRepository.countByRole("ROLE_USER"));
        userRoles.put("ROLE_ADMIN", userRepository.countByRole("ROLE_ADMIN"));
        userRoles.put("active", userRepository.countByActiveTrue());
        userRoles.put("suspended", userRepository.countByActiveFalse());
        analytics.put("userRoles", userRoles);

        // 4. Genre Breakdown across catalog
        Map<String, Integer> genreCounts = new HashMap<>();
        List<Movie> allMovies = movieRepository.findAll();
        for (Movie m : allMovies) {
            if (m.getGenre() != null) {
                String[] tokens = m.getGenre().split("[|/]");
                for (String token : tokens) {
                    String clean = token.trim();
                    if (!clean.isEmpty()) {
                        genreCounts.put(clean, genreCounts.getOrDefault(clean, 0) + 1);
                    }
                }
            }
        }
        analytics.put("genreDistribution", genreCounts);

        return ResponseEntity.ok(analytics);
    }

    // ==========================================
    // 7. AUDIT LOGS
    // ==========================================
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int boundedSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, boundedSize);
        Page<AdminAuditLog> logPage = auditLogRepository.findAllByOrderByTimestampDesc(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("logs", logPage.getContent());
        response.put("currentPage", logPage.getNumber());
        response.put("totalElements", logPage.getTotalElements());
        response.put("totalPages", logPage.getTotalPages());

        return ResponseEntity.ok(response);
    }
}
