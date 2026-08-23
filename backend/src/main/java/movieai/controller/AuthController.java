package movieai.controller;


import movieai.dto.AuthResponse;
import movieai.dto.LoginRequest;
import movieai.dto.RegisterRequest;
import movieai.entity.User;
import movieai.repository.UserRepository;
import movieai.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email is already registered!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // BCrypt Password Encryption
                .role("ROLE_USER")
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        // Accept either a username or an email in the "username" field (matches the "Username or Email" UI field)
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElse(null);

        if (user != null && passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            String token = jwtUtils.generateToken(user.getUsername());
            return ResponseEntity.ok(new AuthResponse(token, "Login Successful"));
        }

        return ResponseEntity.status(401).body(new AuthResponse(null, "Invalid Username or Password"));
    }
}