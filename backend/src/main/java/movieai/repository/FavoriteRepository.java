package movieai.repository;

import movieai.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    Optional<Favorite> findByUserIdAndMovieId(Long userId, Long movieId);
    Boolean existsByUserIdAndMovieId(Long userId, Long movieId);
}
