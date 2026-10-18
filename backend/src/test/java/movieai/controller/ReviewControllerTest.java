package movieai.controller;

import movieai.dto.ReviewDto;
import movieai.dto.ReviewRequest;
import movieai.dto.ReviewStatsDto;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.entity.User;
import movieai.repository.MovieRepository;
import movieai.repository.ReviewRepository;
import movieai.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

public class ReviewControllerTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MovieRepository movieRepository;

    @InjectMocks
    private ReviewController reviewController;

    private AutoCloseable mocks;
    private User sampleUser;
    private User otherUser;
    private Movie sampleMovie;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        sampleUser = User.builder()
                .id(1L)
                .username("critic_alice")
                .email("alice@cinema.ai")
                .role("ROLE_USER")
                .build();

        otherUser = User.builder()
                .id(2L)
                .username("critic_bob")
                .email("bob@cinema.ai")
                .role("ROLE_USER")
                .build();

        sampleMovie = Movie.builder()
                .id(100L)
                .title("Inception")
                .genre("Sci-Fi")
                .build();
    }

    @AfterEach
    void tearDown() throws Exception {
        SecurityContextHolder.clearContext();
        if (mocks != null) {
            mocks.close();
        }
    }

    private void authenticate(User user) {
        org.springframework.security.core.context.SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user.getUsername(), null, List.of());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        Mockito.lenient().when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
    }

    @Test
    void testAddReview_Valid_NewReview() {
        authenticate(sampleUser);

        ReviewRequest request = new ReviewRequest();
        request.setMovieId(100L);
        request.setRating(4.5);
        request.setComment("Mind-bending visual masterpiece! <script>alert('xss')</script>");

        Mockito.when(movieRepository.findById(100L)).thenReturn(Optional.of(sampleMovie));
        Mockito.when(reviewRepository.findByUserIdAndMovieId(1L, 100L)).thenReturn(Optional.empty());

        Mockito.when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(500L);
            return r;
        });

        ResponseEntity<?> response = reviewController.addOrUpdateReview(request);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        ReviewDto dto = (ReviewDto) response.getBody();
        assertNotNull(dto);
        assertEquals(4.5, dto.getRating());
        // Verify XSS script tags were stripped
        assertFalse(dto.getComment().contains("<script>"));
        assertTrue(dto.getComment().contains("Mind-bending"));
    }

    @Test
    void testAddReview_InvalidRating_Rejected() {
        authenticate(sampleUser);

        ReviewRequest request = new ReviewRequest();
        request.setMovieId(100L);
        request.setRating(6.5); // Invalid: max 5.0

        ResponseEntity<?> response = reviewController.addOrUpdateReview(request);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testAddReview_Upsert_UpdatesExistingWithoutDuplicate() {
        authenticate(sampleUser);

        Review existing = Review.builder()
                .id(501L)
                .user(sampleUser)
                .movie(sampleMovie)
                .rating(3.0)
                .comment("Original thought")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        ReviewRequest request = new ReviewRequest();
        request.setMovieId(100L);
        request.setRating(5.0);
        request.setComment("Updated rating: Changed my mind, it's brilliant!");

        Mockito.when(movieRepository.findById(100L)).thenReturn(Optional.of(sampleMovie));
        Mockito.when(reviewRepository.findByUserIdAndMovieId(1L, 100L)).thenReturn(Optional.of(existing));
        Mockito.when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> response = reviewController.addOrUpdateReview(request);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        ReviewDto dto = (ReviewDto) response.getBody();
        assertNotNull(dto);
        assertEquals(5.0, dto.getRating());
        assertEquals(501L, dto.getId()); // Preserves existing ID, updates in place
    }

    @Test
    void testUpdateReview_UnauthorizedUser_Rejected() {
        // Logged in as otherUser (Bob), trying to edit Alice's review
        authenticate(otherUser);

        Review alicesReview = Review.builder()
                .id(600L)
                .user(sampleUser)
                .movie(sampleMovie)
                .rating(4.0)
                .build();

        Mockito.when(reviewRepository.findById(600L)).thenReturn(Optional.of(alicesReview));

        ReviewRequest request = new ReviewRequest();
        request.setRating(1.0);

        ResponseEntity<?> response = reviewController.updateReview(600L, request);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void testGetMovieReviewStats() {
        Mockito.when(reviewRepository.findAverageRatingByMovieId(100L)).thenReturn(4.25);
        Mockito.when(reviewRepository.countVisibleReviewsByMovieId(100L)).thenReturn(24L);

        List<Object[]> mockDist = List.of(
                new Object[]{5, 12L},
                new Object[]{4, 8L},
                new Object[]{3, 4L}
        );
        Mockito.when(reviewRepository.getRatingDistributionByMovieId(100L)).thenReturn(mockDist);

        ResponseEntity<ReviewStatsDto> response = reviewController.getMovieReviewStats(100L);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        ReviewStatsDto stats = response.getBody();
        assertNotNull(stats);
        assertEquals(4.3, stats.getAverageRating());
        assertEquals(24L, stats.getTotalReviews());
        assertEquals(12L, stats.getRatingDistribution().get(5));
        assertEquals(8L, stats.getRatingDistribution().get(4));
    }
}
