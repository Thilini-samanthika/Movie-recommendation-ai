package movieai.repository;

import movieai.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByMovieId(Long movieId);

    List<Review> findByMovieIdAndHiddenFalse(Long movieId);

    Page<Review> findByMovieIdAndHiddenFalse(Long movieId, Pageable pageable);

    Optional<Review> findByUserIdAndMovieId(Long userId, Long movieId);

    List<Review> findByUserId(Long userId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Review> findByReportedTrue();

    List<Review> findByHiddenTrue();

    Page<Review> findByReportedTrue(Pageable pageable);

    Page<Review> findByHiddenTrue(Pageable pageable);

    long countByReportedTrue();

    long countByHiddenTrue();

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.movie.id = :movieId AND r.hidden = false")
    Double findAverageRatingByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.movie.id = :movieId AND r.hidden = false")
    Long countVisibleReviewsByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT ROUND(r.rating) as star, COUNT(r) as count FROM Review r WHERE r.movie.id = :movieId AND r.hidden = false GROUP BY ROUND(r.rating)")
    List<Object[]> getRatingDistributionByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT ROUND(r.rating) as star, COUNT(r) as count FROM Review r GROUP BY ROUND(r.rating)")
    List<Object[]> getOverallRatingDistribution();
}
