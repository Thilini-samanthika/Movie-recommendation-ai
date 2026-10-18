package movieai.controller;

import movieai.dto.WatchlistRequest;
import movieai.entity.Movie;
import movieai.entity.User;
import movieai.entity.Watchlist;
import movieai.repository.MovieRepository;
import movieai.repository.UserRepository;
import movieai.repository.WatchlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    // GET /api/watchlist — Returns the authenticated user's watchlist
    @GetMapping
    public ResponseEntity<?> getWatchlist() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        List<Watchlist> items = watchlistRepository.findByUserIdOrderByAddedAtDesc(user.getId());
        return ResponseEntity.ok(items);
    }

    // GET /api/watchlist/user/{userId} — Fallback for explicit user ID (authorized to self/admin)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserWatchlist(@PathVariable Long userId) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        if (!user.getId().equals(userId) && !"ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Access denied to another user's collection");
        }
        return ResponseEntity.ok(watchlistRepository.findByUserIdOrderByAddedAtDesc(userId));
    }

    // POST /api/watchlist — Add movie to watchlist
    @PostMapping
    public ResponseEntity<?> addToWatchlist(@RequestBody WatchlistRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        if (request.getMovieId() == null) {
            return ResponseEntity.badRequest().body("Movie ID is required");
        }

        if (watchlistRepository.existsByUserIdAndMovieId(user.getId(), request.getMovieId())) {
            return ResponseEntity.badRequest().body("Movie is already in watchlist");
        }

        Movie movie = movieRepository.findById(request.getMovieId()).orElse(null);
        if (movie == null) {
            return ResponseEntity.badRequest().body("Movie not found");
        }

        Watchlist item = Watchlist.builder()
                .user(user)
                .movie(movie)
                .watched(Boolean.TRUE.equals(request.getWatched()))
                .build();

        Watchlist saved = watchlistRepository.save(item);
        return ResponseEntity.ok(saved);
    }

    // DELETE /api/watchlist/{movieId} — Remove movie from watchlist
    @DeleteMapping("/{movieId}")
    public ResponseEntity<?> removeFromWatchlist(@PathVariable Long movieId) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        Optional<Watchlist> item = watchlistRepository.findByUserIdAndMovieId(user.getId(), movieId);
        if (item.isPresent()) {
            watchlistRepository.delete(item.get());
            return ResponseEntity.ok("Movie removed from watchlist");
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH /api/watchlist/{movieId}/watched — Toggle or update watched status
    @PatchMapping("/{movieId}/watched")
    public ResponseEntity<?> toggleWatched(
            @PathVariable Long movieId,
            @RequestParam(required = false) Boolean watched) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        Optional<Watchlist> itemOpt = watchlistRepository.findByUserIdAndMovieId(user.getId(), movieId);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Watchlist item = itemOpt.get();
        if (watched != null) {
            item.setWatched(watched);
        } else {
            item.setWatched(!Boolean.TRUE.equals(item.getWatched()));
        }

        Watchlist updated = watchlistRepository.save(item);
        return ResponseEntity.ok(updated);
    }
}
