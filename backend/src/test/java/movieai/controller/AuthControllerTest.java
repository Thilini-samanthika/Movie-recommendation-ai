package movieai.controller;

import movieai.dto.LoginRequest;
import movieai.dto.RegisterRequest;
import movieai.entity.User;
import movieai.repository.UserRepository;
import movieai.security.JwtUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

public class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthController authController;

    private AutoCloseable mocks;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        sampleUser = User.builder()
                .id(1L)
                .username("cinemafan")
                .email("fan@cinema.ai")
                .password("encoded_pass")
                .role("ROLE_USER")
                .build();
    }

    @AfterEach
    void tearDown() throws Exception {
        if (mocks != null) {
            mocks.close();
        }
    }

    @Test
    void testRegisterUser_Success() {
        RegisterRequest req = new RegisterRequest("newuser", "new@cinema.ai", "Secret123!");
        Mockito.when(userRepository.existsByUsername("newuser")).thenReturn(false);
        Mockito.when(userRepository.existsByEmail("new@cinema.ai")).thenReturn(false);
        Mockito.when(passwordEncoder.encode("Secret123!")).thenReturn("encodedSecret");

        ResponseEntity<?> response = authController.registerUser(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Mockito.verify(userRepository, Mockito.times(1)).save(any(User.class));
    }

    @Test
    void testRegisterUser_UsernameDuplicate() {
        RegisterRequest req = new RegisterRequest("cinemafan", "unique@cinema.ai", "Secret123!");
        Mockito.when(userRepository.existsByUsername("cinemafan")).thenReturn(true);

        ResponseEntity<?> response = authController.registerUser(req);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("already taken"));
    }

    @Test
    void testLoginUser_Success() {
        LoginRequest req = new LoginRequest("cinemafan", "Password123!");
        Mockito.when(userRepository.findByUsername("cinemafan")).thenReturn(Optional.of(sampleUser));
        Mockito.when(passwordEncoder.matches("Password123!", "encoded_pass")).thenReturn(true);
        Mockito.when(jwtUtils.generateToken("cinemafan")).thenReturn("mocked.jwt.token");

        ResponseEntity<?> response = authController.loginUser(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testLoginUser_InvalidPassword() {
        LoginRequest req = new LoginRequest("cinemafan", "WrongPass");
        Mockito.when(userRepository.findByUsername("cinemafan")).thenReturn(Optional.of(sampleUser));
        Mockito.when(passwordEncoder.matches("WrongPass", "encoded_pass")).thenReturn(false);

        ResponseEntity<?> response = authController.loginUser(req);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}
