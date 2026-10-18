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
public class ReviewDto {
    private Long id;
    private Long movieId;
    private String movieTitle;
    private Long userId;
    private String username;
    private Double rating;
    private String comment;
    private Boolean reported;
    private Boolean hidden;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
