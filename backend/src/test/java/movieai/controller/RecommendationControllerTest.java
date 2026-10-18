package movieai.controller;

import movieai.entity.User;
import movieai.repository.UserRepository;
import movieai.service.RecommendationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class RecommendationControllerTest {

    @Mock
    private RecommendationService recommendationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RecommendationController recommendationController;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        sampleUser = User.builder()
                .id(7L)
                .username("cinephile")
                .role("ROLE_USER")
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(User user) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user.getUsername(), null, List.of());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
    }

    @Test
    void testGetRecommendations_Authenticated_ResolvesUserId() {
        authenticate(sampleUser);

        String mockJson = "[{\"id\":10,\"title\":\"Inception\",\"score\":0.92}]";
        when(recommendationService.getAIRecommendations(7L, "Sci-Fi")).thenReturn(mockJson);

        ResponseEntity<String> response = recommendationController.getRecommendations(null, "Sci-Fi");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockJson, response.getBody());
        verify(recommendationService).getAIRecommendations(7L, "Sci-Fi");
    }

    @Test
    void testGetRecommendations_AnonymousUser_PassesNullUserId() {
        SecurityContextHolder.clearContext();

        String mockJson = "[{\"id\":20,\"title\":\"Gladiator\",\"score\":0.88}]";
        when(recommendationService.getAIRecommendations(null, "Action")).thenReturn(mockJson);

        ResponseEntity<String> response = recommendationController.getRecommendations(null, "Action");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockJson, response.getBody());
        verify(recommendationService).getAIRecommendations(null, "Action");
    }

    @Test
    void testGetMoodRecommendations_HappyMood_ReturnsJson() {
        String mockMoodJson = "[{\"id\":30,\"title\":\"Toy Story\",\"mood\":\"happy\"}]";
        when(recommendationService.getMoodRecommendations("happy")).thenReturn(mockMoodJson);

        ResponseEntity<String> response = recommendationController.getMoodRecommendations("happy");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockMoodJson, response.getBody());
        verify(recommendationService).getMoodRecommendations("happy");
    }

    @Test
    void testGetMoodRecommendations_ExcitedMood() {
        String mockMoodJson = "[{\"id\":40,\"title\":\"Mad Max: Fury Road\",\"mood\":\"excited\"}]";
        when(recommendationService.getMoodRecommendations("excited")).thenReturn(mockMoodJson);

        ResponseEntity<String> response = recommendationController.getMoodRecommendations("excited");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockMoodJson, response.getBody());
        verify(recommendationService).getMoodRecommendations("excited");
    }
}
