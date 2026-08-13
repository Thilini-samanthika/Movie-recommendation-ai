package movieai.controller;

import movieai.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    // POST /api/recommendations?userId=1&genre=Action
    @PostMapping
    public ResponseEntity<String> getRecommendations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "Action") String genre) {
        
        String recommendations = recommendationService.getAIRecommendations(userId, genre);
        return ResponseEntity.ok(recommendations);
    }
}
