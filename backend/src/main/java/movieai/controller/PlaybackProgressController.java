package movieai.controller;

import movieai.dto.PlaybackProgressDto;
import movieai.dto.PlaybackProgressRequest;
import movieai.entity.PlaybackProgress;
import movieai.entity.User;
import movieai.repository.PlaybackProgressRepository;
import movieai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/playback-progress", "/api/playback/progress"})
public class PlaybackProgressController {

    @Autowired
    private PlaybackProgressRepository playbackProgressRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    private PlaybackProgressDto toDto(PlaybackProgress p) {
        Map<String, Object> filmMeta = StreamingController.getFilm(p.getFilmId());
        String filmTitle = filmMeta != null ? (String) filmMeta.get("title") : p.getFilmId();
        String thumbnail = filmMeta != null ? (String) filmMeta.get("thumbnail") : null;
        String genre = filmMeta != null ? (String) filmMeta.get("genre") : null;

        double percentage = 0.0;
        if (p.getDurationSeconds() != null && p.getDurationSeconds() > 0) {
            percentage = Math.min(100.0, Math.round((p.getPositionSeconds() / p.getDurationSeconds()) * 1000.0) / 10.0);
        }

        return PlaybackProgressDto.builder()
                .id(p.getId())
                .filmId(p.getFilmId())
                .filmTitle(filmTitle)
                .thumbnail(thumbnail)
                .genre(genre)
                .positionSeconds(p.getPositionSeconds())
                .durationSeconds(p.getDurationSeconds())
                .progressPercentage(percentage)
                .completed(p.getCompleted())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    // 1. Get All Playback Progress for Authenticated User (Most recent first)
    @GetMapping
    public ResponseEntity<?> getUserProgressList() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        List<PlaybackProgress> list = playbackProgressRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());
        List<PlaybackProgressDto> dtos = list.stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // 2. Get Playback Progress for a specific Film
    @GetMapping("/{filmId}")
    public ResponseEntity<?> getFilmProgress(@PathVariable String filmId) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return playbackProgressRepository.findByUserIdAndFilmId(user.getId(), filmId.toLowerCase())
                .map(p -> ResponseEntity.ok(toDto(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Upsert Playback Progress for a specific Film
    @PutMapping("/{filmId}")
    public ResponseEntity<?> saveFilmProgress(
            @PathVariable String filmId,
            @RequestBody PlaybackProgressRequest request) {

        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (request.getPositionSeconds() == null || request.getPositionSeconds() < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid playback position"));
        }
        if (request.getDurationSeconds() == null || request.getDurationSeconds() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid film duration"));
        }

        double pos = Math.min(request.getPositionSeconds(), request.getDurationSeconds());
        double dur = request.getDurationSeconds();
        boolean isCompleted = Boolean.TRUE.equals(request.getCompleted()) || (pos / dur >= 0.95);

        String normalizedFilmId = filmId.toLowerCase();

        PlaybackProgress progress = playbackProgressRepository
                .findByUserIdAndFilmId(user.getId(), normalizedFilmId)
                .orElse(PlaybackProgress.builder()
                        .user(user)
                        .filmId(normalizedFilmId)
                        .build());

        progress.setPositionSeconds(pos);
        progress.setDurationSeconds(dur);
        progress.setCompleted(isCompleted);

        PlaybackProgress saved = playbackProgressRepository.save(progress);
        return ResponseEntity.ok(toDto(saved));
    }

    // 4. Delete Playback Progress from Continue Watching
    @DeleteMapping("/{filmId}")
    public ResponseEntity<?> deleteFilmProgress(@PathVariable String filmId) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        playbackProgressRepository.deleteByUserIdAndFilmId(user.getId(), filmId.toLowerCase());
        return ResponseEntity.ok(Map.of(
                "message", "Playback progress removed successfully",
                "filmId", filmId
        ));
    }
}
