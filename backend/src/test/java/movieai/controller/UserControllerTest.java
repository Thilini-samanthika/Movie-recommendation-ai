package movieai.controller;

import movieai.dto.ReviewDto;
import movieai.dto.UpdateProfileRequest;
import movieai.dto.UserProfileDto;
import movieai.entity.Movie;
import movieai.entity.Review;
import movieai.entity.User;
import movieai.repository.ReviewRepository;
import movieai.repository.UserRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class UserControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserController userController;

    private User sampleUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        sampleUser = User.builder()
                .id(1L)
                .username("moviefan")
                .email("fan@cinema.ai")
                .role("ROLE_USER")
                .password("encoded_pass")
                .build();

        otherUser = User.builder()
                .id(2L)
                .username("otherfan")
                .email("other@cinema.ai")
                .role("ROLE_USER")
                .password("other_pass")
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
    void testGetMyReviews_Unauthenticated_Returns401() {
        SecurityContextHolder.clearContext();
        ResponseEntity<?> response = userController.getMyReviews();
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testGetMyReviews_Authenticated_ReturnsReviewsList() {
        authenticate(sampleUser);

        Movie movie = Movie.builder().id(10L).title("The Matrix").build();
        Review review = Review.builder()
                .id(101L)
                .movie(movie)
                .user(sampleUser)
                .rating(4.5)
                .comment("Groundbreaking sci-fi classic!")
                .reported(false)
                .hidden(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(reviewRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(review));

        ResponseEntity<?> response = userController.getMyReviews();
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        List<ReviewDto> list = (List<ReviewDto>) response.getBody();
        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("The Matrix", list.get(0).getMovieTitle());
        assertEquals(4.5, list.get(0).getRating());
        assertEquals("moviefan", list.get(0).getUsername());
    }

    @Test
    void testGetUserProfile_Success() {
        authenticate(sampleUser);

        ResponseEntity<?> response = userController.getUserProfile();
        assertEquals(HttpStatus.OK, response.getStatusCode());

        UserProfileDto profile = (UserProfileDto) response.getBody();
        assertNotNull(profile);
        assertEquals(1L, profile.getId());
        assertEquals("moviefan", profile.getUsername());
        assertEquals("fan@cinema.ai", profile.getEmail());
    }

    @Test
    void testUpdateUserProfile_Success() {
        authenticate(sampleUser);
        when(passwordEncoder.encode("newsecret123")).thenReturn("encoded_newsecret123");

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setEmail("newemail@cinema.ai");
        req.setNewPassword("newsecret123");

        ResponseEntity<?> response = userController.updateUserProfile(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("newemail@cinema.ai", sampleUser.getEmail());
        assertEquals("encoded_newsecret123", sampleUser.getPassword());
        verify(userRepository).save(sampleUser);
    }

    @Test
    void testDeleteUserAccount_OtherUser_Forbidden() {
        authenticate(sampleUser);

        ResponseEntity<?> response = userController.deleteUserAccount(2L);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void testDeleteUserAccount_OwnAccount_Success() {
        authenticate(sampleUser);
        when(userRepository.existsById(1L)).thenReturn(true);

        ResponseEntity<?> response = userController.deleteUserAccount(1L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userRepository).deleteById(1L);
    }
}
