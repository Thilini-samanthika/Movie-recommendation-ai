package movieai.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
public class RecommendationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private RecommendationService recommendationService;

    private String mockJsonResponse;

    @BeforeEach
    void setUp() {
        mockJsonResponse = "{\"status\":\"success\", \"recommendations\":[\"Inception\", \"Interstellar\"]}";
    }

    @Test
    void testGetAIRecommendations_Success() {
        // Given (Mocking RestTemplate response)
        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockJsonResponse, HttpStatus.OK);
        Mockito.when(restTemplate.postForEntity(anyString(), any(Map.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When (Executing service method)
        String result = recommendationService.getAIRecommendations(1L, "Sci-Fi");

        // Then (Assertions)
        assertNotNull(result);
        assertTrue(result.contains("Inception"));
        assertTrue(result.contains("Interstellar"));
    }

    @Test
    void testGetAIRecommendations_Fallback() {
        // Given (Simulating exception when Python AI engine is down)
        Mockito.when(restTemplate.postForEntity(anyString(), any(Map.class), eq(String.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        // When (Executing service method)
        String result = recommendationService.getAIRecommendations(1L, "Sci-Fi");

        // Then (Verify fallback handling)
        assertNotNull(result);
        assertTrue(result.contains("unreachable"));
    }
}
