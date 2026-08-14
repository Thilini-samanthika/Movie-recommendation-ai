package movieai.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long userId;
    private Long movieId;
    private Double rating;
    private String comment;
}
