package movieai.controller;

import movieai.dto.ReviewDto;
import movieai.dto.ReviewRequest;
import movieai.dto.ReviewStatsDto;
import movieai.entity.Movie;
import movieai.repository.MovieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class MovieControllerTest {

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private ReviewController reviewController;

    @InjectMocks
    private MovieController movieController;

    private Movie sampleMovie;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        sampleMovie = Movie.builder()
                .id(42L)
                .title("Interstellar")
                .genre("Adventure|Drama|Sci-Fi")
                .releaseYear(2014)
                .rating(4.7)
                .build();
    }

    @Test
    void testGetAllMovies_Unfiltered() {
        Page<Movie> page = new PageImpl<>(List.of(sampleMovie));
        when(movieRepository.findAll(any(Pageable.class))).thenReturn(page);

        ResponseEntity<Page<Movie>> response = movieController.getAllMovies(0, 10, null, null, null, null, "id_asc");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getTotalElements());
        assertEquals("Interstellar", response.getBody().getContent().get(0).getTitle());
    }

    @Test
    void testGetMovieById_Found() {
        when(movieRepository.findById(42L)).thenReturn(Optional.of(sampleMovie));

        ResponseEntity<?> response = movieController.getMovieById(42L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Movie result = (Movie) response.getBody();
        assertNotNull(result);
        assertEquals("Interstellar", result.getTitle());
    }

    @Test
    void testGetMovieById_NotFound() {
        when(movieRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = movieController.getMovieById(999L);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testGetMovieReviews_DelegatesToReviewController() {
        ReviewDto reviewDto = ReviewDto.builder()
                .id(1L)
                .movieId(42L)
                .rating(5.0)
                .comment("Phenomenal soundtrack and visuals.")
                .build();

        ResponseEntity resp = ResponseEntity.ok(Map.of("reviews", List.of(reviewDto), "total", 1));
        when(reviewController.getMovieReviews(42L, 0, 10, "newest")).thenReturn(resp);

        ResponseEntity<?> response = movieController.getMovieReviews(42L, 0, 10, "newest");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reviewController).getMovieReviews(42L, 0, 10, "newest");
    }

    @Test
    void testGetMovieRatingSummary_DelegatesToReviewController() {
        ReviewStatsDto statsDto = ReviewStatsDto.builder()
                .averageRating(4.7)
                .totalReviews(150L)
                .ratingDistribution(Map.of(5, 100L, 4, 40L, 3, 10L))
                .build();

        ResponseEntity resp = ResponseEntity.ok(statsDto);
        when(reviewController.getMovieReviewStats(42L)).thenReturn(resp);

        ResponseEntity<?> response = movieController.getMovieRatingSummary(42L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reviewController).getMovieReviewStats(42L);
    }

    @Test
    void testAddMovieReview_DelegatesToReviewControllerWithMovieIdSet() {
        ReviewRequest request = new ReviewRequest();
        request.setRating(5.0);
        request.setComment("One of the best sci-fi movies ever made.");

        ReviewDto savedDto = ReviewDto.builder()
                .id(10L)
                .movieId(42L)
                .rating(5.0)
                .comment("One of the best sci-fi movies ever made.")
                .build();

        ResponseEntity resp = ResponseEntity.ok(savedDto);
        when(reviewController.addOrUpdateReview(any(ReviewRequest.class))).thenReturn(resp);

        ResponseEntity<?> response = movieController.addMovieReview(42L, request);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(42L, request.getMovieId());
        verify(reviewController).addOrUpdateReview(request);
    }
}
