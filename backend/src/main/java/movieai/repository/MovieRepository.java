package movieai.repository;

import movieai.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    Page<Movie> findByTitleContainingIgnoreCaseOrGenreContainingIgnoreCase(String title, String genre, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.genre) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:genre IS NULL OR :genre = '' OR :genre = 'All' OR LOWER(m.genre) LIKE LOWER(CONCAT('%', :genre, '%'))) AND " +
           "(:year IS NULL OR m.releaseYear = :year) AND " +
           "(:minRating IS NULL OR m.rating >= :minRating)")
    Page<Movie> filterMovies(
            @Param("query") String query,
            @Param("genre") String genre,
            @Param("year") Integer year,
            @Param("minRating") Double minRating,
            Pageable pageable
    );
}
