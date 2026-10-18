package movieai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybackProgressDto {
    private Long id;
    private String filmId;
    private String filmTitle;
    private String thumbnail;
    private String genre;
    private Double positionSeconds;
    private Double durationSeconds;
    private Double progressPercentage;
    private Boolean completed;
    private LocalDateTime updatedAt;
}
