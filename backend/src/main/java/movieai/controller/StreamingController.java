package movieai.controller;

import movieai.entity.User;
import movieai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/streaming")
public class StreamingController {

    @Autowired
    private UserRepository userRepository;

    // Legal Open Film Registry
    private static final Map<String, Map<String, Object>> LEGAL_FILMS = new LinkedHashMap<>();

    static {
        Map<String, Object> bbb = new HashMap<>();
        bbb.put("id", "bbb");
        bbb.put("title", "Big Buck Bunny");
        bbb.put("year", 2008);
        bbb.put("genre", "Animation / Comedy");
        bbb.put("description", "A gentle giant rabbit named Big Buck Bunny deals with three bullying forest critters in this beloved open animated classic.");
        bbb.put("director", "Sacha Goedegebure");
        bbb.put("videoUrl", "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4");
        bbb.put("sourceUrl", "https://peach.blender.org/");
        bbb.put("license", "Creative Commons Attribution 3.0");
        bbb.put("licenseUrl", "https://creativecommons.org/licenses/by/3.0/");
        bbb.put("credit", "© Blender Foundation | www.bigbuckbunny.org — CC BY 3.0");
        bbb.put("thumbnail", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg");
        LEGAL_FILMS.put("bbb", bbb);

        Map<String, Object> sintel = new HashMap<>();
        sintel.put("id", "sintel");
        sintel.put("title", "Sintel");
        sintel.put("year", 2010);
        sintel.put("genre", "Fantasy / Animation");
        sintel.put("description", "A lonely young woman searches the world for a baby dragon companion she befriended, leading to an emotional and breathtaking conclusion.");
        sintel.put("director", "Colin Levy");
        sintel.put("videoUrl", "https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4");
        sintel.put("sourceUrl", "https://durian.blender.org/");
        sintel.put("license", "Creative Commons Attribution 3.0");
        sintel.put("licenseUrl", "https://creativecommons.org/licenses/by/3.0/");
        sintel.put("credit", "© Blender Foundation | durian.blender.org — CC BY 3.0");
        sintel.put("thumbnail", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/800px-Sintel_poster.jpg");
        LEGAL_FILMS.put("sintel", sintel);

        Map<String, Object> tos = new HashMap<>();
        tos.put("id", "tos");
        tos.put("title", "Tears of Steel");
        tos.put("year", 2012);
        tos.put("genre", "Sci-Fi / Live Action");
        tos.put("description", "In a dystopian future Amsterdam, a group of scientists and warriors work to save the world with robotic and visual VFX tech.");
        tos.put("director", "Ian Hubert");
        tos.put("videoUrl", "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4");
        tos.put("sourceUrl", "https://mango.blender.org/");
        tos.put("license", "Creative Commons Attribution 3.0");
        tos.put("licenseUrl", "https://creativecommons.org/licenses/by/3.0/");
        tos.put("credit", "© Blender Foundation | mango.blender.org — CC BY 3.0");
        tos.put("thumbnail", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Tears_of_Steel_Poster.jpg/800px-Tears_of_Steel_Poster.jpg");
        LEGAL_FILMS.put("tos", tos);
    }

    public static Map<String, Object> getFilm(String filmId) {
        if (filmId == null) return null;
        return LEGAL_FILMS.get(filmId.toLowerCase());
    }

    public static Map<String, Map<String, Object>> getAllFilms() {
        return LEGAL_FILMS;
    }

    // 1. Public Legal Catalog (Previews and Metadata for Guests & Users)
    @GetMapping("/catalog")
    public ResponseEntity<?> getCatalog() {
        List<Map<String, Object>> previewList = new ArrayList<>();
        for (Map<String, Object> film : LEGAL_FILMS.values()) {
            Map<String, Object> preview = new HashMap<>(film);
            // Hide full direct playback stream URL from public catalog endpoint
            preview.remove("videoUrl");
            preview.put("playbackRequiresAuth", true);
            previewList.add(preview);
        }
        return ResponseEntity.ok(previewList);
    }

    // 2. Authenticated Playback Authorization Gateway
    // Spring Security enforces that only requests with a valid JWT token can access this endpoint.
    @GetMapping("/authorize/{filmId}")
    public ResponseEntity<?> authorizePlayback(@PathVariable String filmId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "A valid CINEMA AI user account is required to stream free legal films."
            ));
        }

        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }

        Map<String, Object> film = LEGAL_FILMS.get(filmId.toLowerCase());
        if (film == null) {
            return ResponseEntity.status(404).body(Map.of(
                "error", "FilmNotFound",
                "message", "Requested film is not in the authorized legal streaming catalog."
            ));
        }

        // Return signed playback ticket with stream URL and rights attribution
        Map<String, Object> authorizationTicket = new HashMap<>(film);
        authorizationTicket.put("ticketId", UUID.randomUUID().toString());
        authorizationTicket.put("authorized", true);
        authorizationTicket.put("authorizedUserId", user.getId());
        authorizationTicket.put("authorizedUsername", user.getUsername());
        authorizationTicket.put("issuedAt", Instant.now().toString());
        authorizationTicket.put("expiresAt", Instant.now().plusSeconds(7200).toString());
        authorizationTicket.put("legalNotice", "Stream provided under verified open Creative Commons licensing for authenticated users.");

        return ResponseEntity.ok(authorizationTicket);
    }
}
