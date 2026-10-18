package movieai.service;

import movieai.entity.Favorite;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.repository.FavoriteRepository;
import movieai.repository.MovieRepository;
import movieai.repository.ReviewRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

public class RecommendationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private MovieRepository movieRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private AutoCloseable mocks;
    private String mockJsonResponse;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        mockJsonResponse = "{\"status\":\"success\", \"recommendations\":[{\"clean_title\":\"Inception\"}, {\"clean_title\":\"Interstellar\"}]}";
    }

    @AfterEach
    void tearDown() throws Exception {
        if (mocks != null) {
            mocks.close();
        }
    }

    @Test
    void testGetAIRecommendations_Success_WithFavorites() {
        // Given (User has a favorite movie)
        Movie favMovie = Movie.builder().id(1L).title("The Matrix (1999)").build();
        Favorite fav = Favorite.builder().id(1L).movie(favMovie).build();
        Mockito.when(favoriteRepository.findByUserId(1L)).thenReturn(List.of(fav));

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockJsonResponse, HttpStatus.OK);
        Mockito.when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        String result = recommendationService.getAIRecommendations(1L, "Sci-Fi");

        // Then
        assertNotNull(result);
        assertTrue(result.contains("Inception"));
        assertTrue(result.contains("Interstellar"));
    }

    @Test
    void testGetAIRecommendations_Success_WithHighRatedReviews() {
        // User has no favorites, but rated a movie 5.0 stars
        Mockito.when(favoriteRepository.findByUserId(3L)).thenReturn(List.of());
        Movie ratedMovie = Movie.builder().id(50L).title("Interstellar (2014)").build();
        Review highReview = Review.builder().id(10L).movie(ratedMovie).rating(5.0).hidden(false).build();
        Mockito.when(reviewRepository.findByUserId(3L)).thenReturn(List.of(highReview));

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockJsonResponse, HttpStatus.OK);
        Mockito.when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        String result = recommendationService.getAIRecommendations(3L, "Sci-Fi");
        assertNotNull(result);
        assertTrue(result.contains("Inception"));
    }

    @Test
    void testGetAIRecommendations_Success_GenreFallback() {
        // Given (User has no favorites and no reviews, fallback to genre search)
        Mockito.when(favoriteRepository.findByUserId(2L)).thenReturn(List.of());
        Mockito.when(reviewRepository.findByUserId(2L)).thenReturn(List.of());
        Movie genreMovie = Movie.builder().id(2L).title("Toy Story (1995)").genre("Animation").build();
        Mockito.when(movieRepository.findByTitleContainingIgnoreCaseOrGenreContainingIgnoreCase(
                eq(""), eq("Animation"), any(PageRequest.class)
        )).thenReturn(new PageImpl<>(List.of(genreMovie)));

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockJsonResponse, HttpStatus.OK);
        Mockito.when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        String result = recommendationService.getAIRecommendations(2L, "Animation");

        // Then
        assertNotNull(result);
        assertTrue(result.contains("Inception"));
    }

    @Test
    void testGetAIRecommendations_Fallback() {
        // Given (Simulating exception when Python AI engine is down)
        Mockito.when(favoriteRepository.findByUserId(1L)).thenReturn(List.of());
        Mockito.when(reviewRepository.findByUserId(1L)).thenReturn(List.of());
        Mockito.when(movieRepository.findByTitleContainingIgnoreCaseOrGenreContainingIgnoreCase(
                anyString(), anyString(), any(PageRequest.class)
        )).thenReturn(new PageImpl<>(List.of()));

        Mockito.when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        // When
        String result = recommendationService.getAIRecommendations(1L, "Sci-Fi");

        // Then
        assertNotNull(result);
        assertTrue(result.contains("unreachable"));
    }

    @Test
    void testGetMoodRecommendations_Success() {
        String mockMoodJson = "[{\"id\":1,\"title\":\"Toy Story\",\"mood\":\"happy\"}]";
        Mockito.when(restTemplate.getForObject(contains("/mood-recommendations?mood=happy"), eq(String.class)))
                .thenReturn(mockMoodJson);

        String result = recommendationService.getMoodRecommendations("happy");
        assertNotNull(result);
        assertTrue(result.contains("Toy Story"));
    }
}
