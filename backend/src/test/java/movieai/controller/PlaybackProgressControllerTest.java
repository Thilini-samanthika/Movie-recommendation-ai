package movieai.controller;

import movieai.dto.PlaybackProgressDto;
import movieai.dto.PlaybackProgressRequest;
import movieai.entity.PlaybackProgress;
import movieai.entity.User;
import movieai.repository.PlaybackProgressRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

public class PlaybackProgressControllerTest {

    @Mock
    private PlaybackProgressRepository playbackProgressRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PlaybackProgressController playbackProgressController;

    private AutoCloseable mocks;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        sampleUser = User.builder()
                .id(1L)
                .username("testviewer")
                .email("testviewer@cinema.ai")
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

    private void authenticate() {
        org.springframework.security.core.context.SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("testviewer", null, List.of());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        Mockito.lenient().when(userRepository.findByUsername("testviewer")).thenReturn(Optional.of(sampleUser));
    }

    @Test
    void testGetUserProgressList_Unauthenticated() {
        SecurityContextHolder.clearContext();
        ResponseEntity<?> response = playbackProgressController.getUserProgressList();
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testGetUserProgressList_Authenticated() {
        authenticate();

        PlaybackProgress progress = PlaybackProgress.builder()
                .id(101L)
                .user(sampleUser)
                .filmId("bbb")
                .positionSeconds(120.0)
                .durationSeconds(600.0)
                .completed(false)
                .updatedAt(LocalDateTime.now())
                .build();

        Mockito.when(playbackProgressRepository.findByUserIdOrderByUpdatedAtDesc(1L))
                .thenReturn(List.of(progress));

        ResponseEntity<?> response = playbackProgressController.getUserProgressList();
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        List<PlaybackProgressDto> list = (List<PlaybackProgressDto>) response.getBody();
        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("bbb", list.get(0).getFilmId());
        assertEquals("Big Buck Bunny", list.get(0).getFilmTitle());
        assertEquals(20.0, list.get(0).getProgressPercentage());
    }

    @Test
    void testSaveFilmProgress_Valid() {
        authenticate();

        PlaybackProgressRequest request = PlaybackProgressRequest.builder()
                .positionSeconds(372.0)
                .durationSeconds(888.0)
                .completed(false)
                .build();

        Mockito.when(playbackProgressRepository.findByUserIdAndFilmId(1L, "sintel"))
                .thenReturn(Optional.empty());

        Mockito.when(playbackProgressRepository.save(any(PlaybackProgress.class)))
                .thenAnswer(inv -> {
                    PlaybackProgress p = inv.getArgument(0);
                    p.setId(201L);
                    p.setUpdatedAt(LocalDateTime.now());
                    return p;
                });

        ResponseEntity<?> response = playbackProgressController.saveFilmProgress("sintel", request);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        PlaybackProgressDto dto = (PlaybackProgressDto) response.getBody();
        assertNotNull(dto);
        assertEquals("sintel", dto.getFilmId());
        assertEquals(372.0, dto.getPositionSeconds());
        assertEquals(41.9, dto.getProgressPercentage());
        assertFalse(dto.getCompleted());
    }

    @Test
    void testSaveFilmProgress_InvalidPosition() {
        authenticate();

        PlaybackProgressRequest request = PlaybackProgressRequest.builder()
                .positionSeconds(-5.0)
                .durationSeconds(600.0)
                .build();

        ResponseEntity<?> response = playbackProgressController.saveFilmProgress("bbb", request);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testDeleteFilmProgress() {
        authenticate();

        ResponseEntity<?> response = playbackProgressController.deleteFilmProgress("bbb");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Mockito.verify(playbackProgressRepository).deleteByUserIdAndFilmId(1L, "bbb");
    }
}
