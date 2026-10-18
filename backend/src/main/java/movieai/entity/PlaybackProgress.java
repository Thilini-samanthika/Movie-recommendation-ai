package movieai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "playback_progress",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_film", columnNames = {"user_id", "film_id"})
    },
    indexes = {
        @Index(name = "idx_user_updated", columnList = "user_id, updated_at DESC")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybackProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "film_id", nullable = false, length = 64)
    private String filmId;

    @Column(name = "position_seconds", nullable = false)
    private Double positionSeconds;

    @Column(name = "duration_seconds", nullable = false)
    private Double durationSeconds;

    @Builder.Default
    @Column(name = "completed", nullable = false)
    private Boolean completed = false;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
