package movieai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String message;
    private Long id;
    private String username;
    private String email;
    private String role;

    public AuthResponse(String token, String message) {
        this.token = token;
        this.message = message;
    }
}
