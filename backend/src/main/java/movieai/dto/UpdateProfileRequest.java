package movieai.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String email;
    private String newPassword; // Optional
}
