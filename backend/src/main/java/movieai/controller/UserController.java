package movieai.controller;

import movieai.dto.UpdateProfileRequest;
import movieai.dto.UserProfileDto;
import movieai.entity.User;
import movieai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private movieai.repository.ReviewRepository reviewRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // GET /api/users/me/reviews - Fetch all reviews created by authenticated user
    @GetMapping("/me/reviews")
    public ResponseEntity<?> getMyReviews() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(401).body(java.util.Map.of("error", "Unauthorized"));
        }
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("error", "User not found"));
        }
        var reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        var dtos = reviews.stream().map(r -> movieai.dto.ReviewDto.builder()
                .id(r.getId())
                .movieId(r.getMovie().getId())
                .movieTitle(r.getMovie().getTitle())
                .userId(user.getId())
                .username(user.getUsername())
                .rating(r.getRating())
                .comment(r.getComment())
                .reported(r.getReported())
                .hidden(r.getHidden())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build()).toList();
        return ResponseEntity.ok(dtos);
    }

    // 1. GET Logged-in User Profile
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        UserProfileDto profile = UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();

        return ResponseEntity.ok(profile);
    }

    // 2. PUT Update User Profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody UpdateProfileRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(user);
        return ResponseEntity.ok("User profile updated successfully!");
    }

    // 3. DELETE User Account by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUserAccount(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByUsername(auth.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        if (!currentUser.getId().equals(id) && !"ROLE_ADMIN".equals(currentUser.getRole())) {
            return ResponseEntity.status(403).body("Unauthorized to delete another user's account");
        }

        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok("User account deleted successfully!");
    }
}
