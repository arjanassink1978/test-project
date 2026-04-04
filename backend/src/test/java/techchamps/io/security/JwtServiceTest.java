package techchamps.io.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import techchamps.io.model.AppUser;
import techchamps.io.model.Role;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "test-secret-key-that-is-at-least-32-bytes-long!";
    private static final long EXPIRATION_MS = 3_600_000L;

    private JwtService jwtService;
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
        signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void generateToken_containsCorrectSubject() {
        AppUser user = new AppUser("user@example.com", "testuser", "password", Role.USER);

        String token = jwtService.generateToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.getSubject()).isEqualTo("testuser");
    }

    @Test
    void generateToken_containsRoleClaim() {
        AppUser user = new AppUser("admin@example.com", "adminuser", "password", Role.ADMIN);

        String token = jwtService.generateToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.get("role", String.class)).isEqualTo("ADMIN");
    }

    @Test
    void generateToken_containsUserIdClaim() {
        AppUser user = new AppUser("mod@example.com", "moduser", "password", Role.MODERATOR);
        // Inject an id via reflection so the claim is present and non-null
        try {
            java.lang.reflect.Field idField = AppUser.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, 99L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        String token = jwtService.generateToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.get("userId", Long.class)).isEqualTo(99L);
    }

    @Test
    void generateToken_hasExpirationInFuture() {
        AppUser user = new AppUser("user@example.com", "testuser", "password", Role.USER);

        String token = jwtService.generateToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.getExpiration()).isAfter(new Date());
    }

    @Test
    void generateToken_expirationMatchesConfiguredValue() {
        AppUser user = new AppUser("user@example.com", "testuser", "password", Role.USER);
        long before = System.currentTimeMillis();

        String token = jwtService.generateToken(user);

        long after = System.currentTimeMillis();
        Claims claims = parseClaims(token);
        long expiryMs = claims.getExpiration().getTime();
        // Expiry must be roughly now + expirationMs (allow 2s tolerance for slow machines)
        assertThat(expiryMs).isGreaterThanOrEqualTo(before + EXPIRATION_MS - 2000);
        assertThat(expiryMs).isLessThanOrEqualTo(after + EXPIRATION_MS + 2000);
    }

    @Test
    void generateToken_differentUsersProduceDifferentTokens() {
        AppUser user1 = new AppUser("a@example.com", "alice", "pass", Role.USER);
        AppUser user2 = new AppUser("b@example.com", "bob", "pass", Role.USER);

        String token1 = jwtService.generateToken(user1);
        String token2 = jwtService.generateToken(user2);

        assertThat(token1).isNotEqualTo(token2);
    }

    @Test
    void generateToken_forUserRole_setsUserRole() {
        AppUser user = new AppUser("user@example.com", "regularuser", "password", Role.USER);

        String token = jwtService.generateToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.get("role", String.class)).isEqualTo("USER");
    }

    @Test
    void generateToken_forModeratorRole_setsModeratorRole() {
        AppUser user = new AppUser("mod@example.com", "moduser", "password", Role.MODERATOR);

        String token = jwtService.generateToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.get("role", String.class)).isEqualTo("MODERATOR");
    }

    @Test
    void getExpirationMs_returnsConfiguredValue() {
        assertThat(jwtService.getExpirationMs()).isEqualTo(EXPIRATION_MS);
    }

    @Test
    void generateToken_returnsNonNullNonEmptyString() {
        AppUser user = new AppUser("user@example.com", "testuser", "password", Role.USER);

        String token = jwtService.generateToken(user);

        assertThat(token).isNotNull().isNotEmpty();
    }

    @Test
    void generateToken_producesValidJwt() {
        AppUser user = new AppUser("user@example.com", "testuser", "password", Role.USER);

        String token = jwtService.generateToken(user);

        // Should not throw — valid JWT can be parsed
        Claims claims = parseClaims(token);
        assertThat(claims).isNotNull();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
