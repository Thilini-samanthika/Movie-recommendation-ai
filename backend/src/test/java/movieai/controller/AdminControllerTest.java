package movieai.controller;

import movieai.entity.AdminAuditLog;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.entity.User;
import movieai.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class AdminControllerTest {

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private WatchlistRepository watchlistRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    @InjectMocks
    private AdminController adminController;

    private AutoCloseable mocks;
    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        adminUser = User.builder()
                .id(1L)
                .username("admin1")
                .email("admin@test.com")
                .role("ROLE_ADMIN")
                .active(true)
                .build();

        regularUser = User.builder()
                .id(2L)
                .username("john_doe")
                .email("john@test.com")
                .role("ROLE_USER")
                .active(true)
                .build();

        Authentication auth = mock(Authentication.class);
        lenient().when(auth.isAuthenticated()).thenReturn(true);
        lenient().when(auth.getName()).thenReturn("admin1");

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        lenient().when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));
    }

    @AfterEach
    void tearDown() throws Exception {
        SecurityContextHolder.clearContext();
        if (mocks != null) {
            mocks.close();
        }
    }

    @Test
    void testGetAdminStats_Success() {
        when(movieRepository.count()).thenReturn(100L);
        when(userRepository.count()).thenReturn(25L);
        when(userRepository.countByActiveTrue()).thenReturn(24L);
        when(userRepository.countByActiveFalse()).thenReturn(1L);
        when(favoriteRepository.count()).thenReturn(50L);
        when(watchlistRepository.count()).thenReturn(30L);
        when(reviewRepository.count()).thenReturn(80L);
        when(reviewRepository.countByReportedTrue()).thenReturn(2L);
        when(reviewRepository.countByHiddenTrue()).thenReturn(1L);

        ResponseEntity<?> response = adminController.getAdminStats();
        assertEquals(200, response.getStatusCode().value());

        @SuppressWarnings("unchecked")
        Map<String, Object> stats = (Map<String, Object>) response.getBody();
        assertNotNull(stats);
        assertEquals(100L, stats.get("totalMovies"));
        assertEquals(25L, stats.get("totalUsers"));
        assertEquals(24L, stats.get("activeUsers"));
        assertEquals(2L, stats.get("reportedReviews"));
        assertEquals("Healthy / Operational", stats.get("systemStatus"));
    }

    @Test
    void testToggleUserStatus_DeactivateRegularUser_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<?> response = adminController.toggleUserStatus(2L, Map.of("active", false));
        assertEquals(200, response.getStatusCode().value());
        assertFalse(regularUser.getActive());
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void testToggleUserStatus_PreventDeactivatingLastAdmin() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRoleAndActiveTrue("ROLE_ADMIN")).thenReturn(1L);

        ResponseEntity<?> response = adminController.toggleUserStatus(1L, Map.of("active", false));
        assertEquals(400, response.getStatusCode().value());
        assertTrue(adminUser.getActive());
    }

    @Test
    void testChangeUserRole_PreventDemotingLastAdmin() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRoleAndActiveTrue("ROLE_ADMIN")).thenReturn(1L);

        ResponseEntity<?> response = adminController.changeUserRole(1L, Map.of("role", "ROLE_USER"));
        assertEquals(400, response.getStatusCode().value());
        assertEquals("ROLE_ADMIN", adminUser.getRole());
    }

    @Test
    void testChangeUserRole_PromoteUser_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<?> response = adminController.changeUserRole(2L, Map.of("role", "ROLE_ADMIN"));
        assertEquals(200, response.getStatusCode().value());
        assertEquals("ROLE_ADMIN", regularUser.getRole());
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void testReviewModeration_HideAndRestore() {
        Movie movie = Movie.builder().id(10L).title("Test Movie").build();
        Review review = Review.builder()
                .id(99L)
                .movie(movie)
                .user(regularUser)
                .rating(4.0)
                .comment("Spam comment")
                .reported(true)
                .hidden(false)
                .build();

        when(reviewRepository.findById(99L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Hide Review
        ResponseEntity<?> hideResp = adminController.hideReview(99L);
        assertEquals(200, hideResp.getStatusCode().value());
        assertTrue(review.getHidden());

        // 2. Restore Review
        ResponseEntity<?> restoreResp = adminController.restoreReview(99L);
        assertEquals(200, restoreResp.getStatusCode().value());
        assertFalse(review.getHidden());
        assertFalse(review.getReported());

        verify(auditLogRepository, times(2)).save(any(AdminAuditLog.class));
    }

    @Test
    void testAddMovie_Success() {
        Movie newMovie = Movie.builder()
                .title("Interstellar")
                .genre("Sci-Fi|Adventure")
                .releaseYear(2014)
                .rating(4.8)
                .build();

        when(movieRepository.save(any(Movie.class))).thenReturn(newMovie);

        ResponseEntity<?> response = adminController.addMovie(newMovie);
        assertEquals(200, response.getStatusCode().value());
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void testAddMovie_InvalidInput_Fails() {
        Movie emptyTitleMovie = Movie.builder().title("").build();
        ResponseEntity<?> response = adminController.addMovie(emptyTitleMovie);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void testSystemHealth_ReturnsHealthStatus() {
        when(userRepository.count()).thenReturn(25L);
        ResponseEntity<?> response = adminController.getSystemHealth();
        assertEquals(200, response.getStatusCode().value());
        @SuppressWarnings("unchecked")
        Map<String, Object> health = (Map<String, Object>) response.getBody();
        assertNotNull(health);
        assertEquals("UP", health.get("backend"));
        assertEquals("UP", health.get("database"));
        assertNotNull(health.get("aiService"));
        assertNotNull(health.get("timestamp"));
    }
}

