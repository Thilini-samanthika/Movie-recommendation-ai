package movieai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "admin_audit_logs",
    indexes = {
        @Index(name = "idx_audit_timestamp", columnList = "timestamp DESC"),
        @Index(name = "idx_audit_action", columnList = "action")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_username", nullable = false)
    private String adminUsername;

    @Column(nullable = false, length = 64)
    private String action; // e.g. "USER_ROLE_CHANGE", "USER_STATUS_CHANGE", "REVIEW_MODERATION", "MOVIE_CREATE", "MOVIE_UPDATE", "MOVIE_DELETE"

    @Column(name = "target_entity", length = 64)
    private String targetEntity; // "USER", "REVIEW", "MOVIE", "LEGAL_FILM"

    @Column(name = "target_id")
    private Long targetId;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
