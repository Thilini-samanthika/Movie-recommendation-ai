package movieai.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class RecommendationService {

    @Autowired
    private RestTemplate restTemplate;

    // Member 1 ගේ Python AI Engine Port & Endpoint එක
    private final String PYTHON_AI_URL = "http://localhost:5000/predict";

    public String getAIRecommendations(Long userId, String genre) {
        try {
            // Python API එකට යවන Payload (JSON Body) එක
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("user_id", userId);
            requestBody.put("genre", genre);

            // Python AI Engine එකට POST Request එකක් යැවීම
            ResponseEntity<String> response = restTemplate.postForEntity(PYTHON_AI_URL, requestBody, String.class);
            return response.getBody();
            
        } catch (Exception e) {
            // Python AI Service එක Down වී ඇත්නම් Fallback Response එකක් ලබාදීම
            return "{\"status\": \"error\", \"message\": \"AI Recommendation engine is currently unreachable. Make sure Python service is running on port 5000.\"}";
        }
    }
}
