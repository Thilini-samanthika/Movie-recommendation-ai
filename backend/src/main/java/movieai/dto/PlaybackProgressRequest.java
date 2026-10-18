package movieai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybackProgressRequest {
    private Double positionSeconds;
    private Double durationSeconds;
    private Boolean completed;
}
