package movieai.controller;

import movieai.entity.User;
import movieai.repository.UserRepository;
import movieai.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private UserRepository userRepository;

    private Long resolveUserId(Long paramUserId) {
        if (paramUserId != null) {
            return paramUserId;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            User user = userRepository.findByUsername(auth.getName()).orElse(null);
            if (user != null) {
                return user.getId();
            }
        }
        return null;
    }

    // POST /api/recommendations?userId=1&genre=Action
    @PostMapping
    public ResponseEntity<String> getRecommendations(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "Action") String genre) {

        Long effectiveUserId = resolveUserId(userId);
        String recommendations = recommendationService.getAIRecommendations(effectiveUserId, genre);
        return ResponseEntity.ok(recommendations);
    }

    // GET /api/recommendations?userId=1&genre=Action
    @GetMapping
    public ResponseEntity<String> getRecommendationsGet(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "Action") String genre) {

        Long effectiveUserId = resolveUserId(userId);
        String recommendations = recommendationService.getAIRecommendations(effectiveUserId, genre);
        return ResponseEntity.ok(recommendations);
    }

    // GET /api/recommendations/mood?mood=excited
    @GetMapping("/mood")
    public ResponseEntity<String> getMoodRecommendations(@RequestParam(defaultValue = "happy") String mood) {
        String results = recommendationService.getMoodRecommendations(mood);
        return ResponseEntity.ok(results);
    }
}
