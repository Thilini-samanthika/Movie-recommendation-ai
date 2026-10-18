package movieai.repository;

import movieai.entity.PlaybackProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaybackProgressRepository extends JpaRepository<PlaybackProgress, Long> {

    List<PlaybackProgress> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<PlaybackProgress> findByUserIdAndFilmId(Long userId, String filmId);

    @Transactional
    @Modifying
    @Query("DELETE FROM PlaybackProgress p WHERE p.user.id = :userId AND p.filmId = :filmId")
    void deleteByUserIdAndFilmId(@Param("userId") Long userId, @Param("filmId") String filmId);
}
