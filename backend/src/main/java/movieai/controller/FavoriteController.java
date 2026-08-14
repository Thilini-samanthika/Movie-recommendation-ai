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

    // Add Movie to Favorites
    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody FavoriteRequest request) {
        if (favoriteRepository.existsByUserIdAndMovieId(request.getUserId(), request.getMovieId())) {
            return ResponseEntity.badRequest().body("Movie is already in favorites!");
        }

        User user = userRepository.findById(request.getUserId()).orElse(null);
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

    // Get User's Favorite Movies
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Favorite>> getUserFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(favoriteRepository.findByUserId(userId));
    }

    // Remove Movie from Favorites
    @DeleteMapping
    public ResponseEntity<?> removeFavorite(@RequestParam Long userId, @RequestParam Long movieId) {
        Optional<Favorite> favorite = favoriteRepository.findByUserIdAndMovieId(userId, movieId);
        
        if (favorite.isPresent()) {
            favoriteRepository.delete(favorite.get());
            return ResponseEntity.ok("Movie removed from favorites!");
        }

        return ResponseEntity.notFound().build();
    }
}
