package movieai.controller;

import movieai.dto.WatchlistRequest;
import movieai.entity.Movie;
import movieai.entity.User;
import movieai.entity.Watchlist;
import movieai.repository.MovieRepository;
import movieai.repository.UserRepository;
import movieai.repository.WatchlistRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

public class WatchlistControllerTest {

    @Mock
    private WatchlistRepository watchlistRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MovieRepository movieRepository;

    @InjectMocks
    private WatchlistController watchlistController;

    private AutoCloseable mocks;
    private User sampleUser;
    private Movie sampleMovie;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        sampleUser = User.builder().id(5L).username("cinephile").role("ROLE_USER").build();
        sampleMovie = Movie.builder().id(100L).title("Interstellar").build();

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("cinephile", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() throws Exception {
        SecurityContextHolder.clearContext();
        if (mocks != null) {
            mocks.close();
        }
    }

    @Test
    void testGetWatchlist_Success() {
        Mockito.when(userRepository.findByUsername("cinephile")).thenReturn(Optional.of(sampleUser));
        Watchlist item = Watchlist.builder().id(1L).user(sampleUser).movie(sampleMovie).watched(false).build();
        Mockito.when(watchlistRepository.findByUserIdOrderByAddedAtDesc(5L)).thenReturn(List.of(item));

        ResponseEntity<?> response = watchlistController.getWatchlist();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<?> list = (List<?>) response.getBody();
        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    void testAddToWatchlist_Success() {
        Mockito.when(userRepository.findByUsername("cinephile")).thenReturn(Optional.of(sampleUser));
        Mockito.when(watchlistRepository.existsByUserIdAndMovieId(5L, 100L)).thenReturn(false);
        Mockito.when(movieRepository.findById(100L)).thenReturn(Optional.of(sampleMovie));

        Watchlist savedItem = Watchlist.builder().id(2L).user(sampleUser).movie(sampleMovie).watched(false).build();
        Mockito.when(watchlistRepository.save(any(Watchlist.class))).thenReturn(savedItem);

        WatchlistRequest req = new WatchlistRequest(100L, false);
        ResponseEntity<?> response = watchlistController.addToWatchlist(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testToggleWatched_Success() {
        Mockito.when(userRepository.findByUsername("cinephile")).thenReturn(Optional.of(sampleUser));
        Watchlist item = Watchlist.builder().id(1L).user(sampleUser).movie(sampleMovie).watched(false).build();
        Mockito.when(watchlistRepository.findByUserIdAndMovieId(5L, 100L)).thenReturn(Optional.of(item));
        Mockito.when(watchlistRepository.save(any(Watchlist.class))).thenReturn(item);

        ResponseEntity<?> response = watchlistController.toggleWatched(100L, true);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
