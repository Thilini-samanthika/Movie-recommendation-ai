package movieai.controller;

import movieai.entity.User;
import movieai.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class StreamingControllerTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StreamingController streamingController;

    private AutoCloseable mocks;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        sampleUser = User.builder()
                .id(10L)
                .username("cinemapatron")
                .email("patron@cinema.ai")
                .role("ROLE_USER")
                .build();
    }

    @AfterEach
    void tearDown() throws Exception {
        SecurityContextHolder.clearContext();
        if (mocks != null) {
            mocks.close();
        }
    }

    @Test
    void testGetCatalog_PubliclyAccessible() {
        ResponseEntity<?> response = streamingController.getCatalog();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<?> catalog = (List<?>) response.getBody();
        assertNotNull(catalog);
        assertTrue(catalog.size() >= 3);
    }

    @Test
    void testAuthorizePlayback_Unauthenticated() {
        // Without authentication in context
        SecurityContextHolder.clearContext();

        ResponseEntity<?> response = streamingController.authorizePlayback("bbb");
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testAuthorizePlayback_Authenticated_Success() {
        // Set authenticated user in security context
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("cinemapatron", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Mockito.when(userRepository.findByUsername("cinemapatron")).thenReturn(Optional.of(sampleUser));

        ResponseEntity<?> response = streamingController.authorizePlayback("bbb");
        assertEquals(HttpStatus.OK, response.getStatusCode());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("authorized"));
        assertEquals("Big Buck Bunny", body.get("title"));
        assertNotNull(body.get("videoUrl"));
        assertNotNull(body.get("ticketId"));
    }

    @Test
    void testAuthorizePlayback_UnknownFilm() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("cinemapatron", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Mockito.when(userRepository.findByUsername("cinemapatron")).thenReturn(Optional.of(sampleUser));

        ResponseEntity<?> response = streamingController.authorizePlayback("nonexistent_film");
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
