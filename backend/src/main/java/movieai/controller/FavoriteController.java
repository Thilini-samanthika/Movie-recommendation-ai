package movieai.controller;

import movieai.dto.FavoriteRequest;
import movieai.entity.Favorite;
import movieai.entity.Movie;
import movieai.entity.User;
import movieai.repository.FavoriteRepository;
import movieai.repository.MovieRepository;
import movieai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired
    private FavoriteRepository favoriteRepository;

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

    // GET /api/favorites — Returns current authenticated user's favorites
    @GetMapping
    public ResponseEntity<?> getCurrentUserFavorites() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        return ResponseEntity.ok(favoriteRepository.findByUserId(user.getId()));
    }

    // Add Movie to Favorites
    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody FavoriteRequest request) {
        User authUser = getAuthenticatedUser();
        Long targetUserId = (authUser != null) ? authUser.getId() : request.getUserId();

        if (targetUserId == null) {
            return ResponseEntity.badRequest().body("User ID is required!");
        }

        // If request specified a different user, ensure only admin can do that
        if (authUser != null && request.getUserId() != null && !authUser.getId().equals(request.getUserId()) && !"ROLE_ADMIN".equals(authUser.getRole())) {
            return ResponseEntity.status(403).body("Cannot modify another user's favorites");
        }

        if (favoriteRepository.existsByUserIdAndMovieId(targetUserId, request.getMovieId())) {
            return ResponseEntity.badRequest().body("Movie is already in favorites!");
        }

        User user = (authUser != null && authUser.getId().equals(targetUserId))
                ? authUser
                : userRepository.findById(targetUserId).orElse(null);
        Movie movie = movieRepository.findById(request.getMovieId()).orElse(null);

        if (user == null || movie == null) {
            return ResponseEntity.badRequest().body("User or Movie not found!");
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .movie(movie)
                .build();

        favoriteRepository.save(favorite);
        return ResponseEntity.ok("Movie added to favorites successfully!");
    }

    // Get User's Favorite Movies by User ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserFavorites(@PathVariable Long userId) {
        User authUser = getAuthenticatedUser();
        if (authUser != null && !authUser.getId().equals(userId) && !"ROLE_ADMIN".equals(authUser.getRole())) {
            return ResponseEntity.status(403).body("Access denied to another user's favorites");
        }
        return ResponseEntity.ok(favoriteRepository.findByUserId(userId));
    }

    // Remove Movie from Favorites
    @DeleteMapping
    public ResponseEntity<?> removeFavorite(@RequestParam(required = false) Long userId, @RequestParam Long movieId) {
        User authUser = getAuthenticatedUser();
        Long effectiveUserId = (authUser != null) ? authUser.getId() : userId;

        if (effectiveUserId == null) {
            return ResponseEntity.badRequest().body("User ID is required!");
        }

        if (authUser != null && userId != null && !authUser.getId().equals(userId) && !"ROLE_ADMIN".equals(authUser.getRole())) {
            return ResponseEntity.status(403).body("Cannot remove favorites for another user");
        }

        Optional<Favorite> favorite = favoriteRepository.findByUserIdAndMovieId(effectiveUserId, movieId);

        if (favorite.isPresent()) {
            favoriteRepository.delete(favorite.get());
            return ResponseEntity.ok("Movie removed from favorites!");
        }

        return ResponseEntity.notFound().build();
    }
}
