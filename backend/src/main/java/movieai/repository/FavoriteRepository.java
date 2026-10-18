package movieai.repository;

import movieai.entity.Favorite;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    Optional<Favorite> findByUserIdAndMovieId(Long userId, Long movieId);
    Boolean existsByUserIdAndMovieId(Long userId, Long movieId);

    @Query("SELECT f.movie.id, f.movie.title, f.movie.genre, COUNT(f) as favCount FROM Favorite f GROUP BY f.movie.id, f.movie.title, f.movie.genre ORDER BY favCount DESC")
    List<Object[]> findTopFavoritedMovies(Pageable pageable);
}
