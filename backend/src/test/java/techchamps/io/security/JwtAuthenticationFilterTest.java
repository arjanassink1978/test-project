package techchamps.io.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String SECRET = "test-secret-key-that-is-at-least-32-bytes-long!";

    private JwtAuthenticationFilter filter;
    private SecretKey signingKey;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private UserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(SECRET, userDetailsService);
        signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_withValidBearerToken_setsAuthentication() throws Exception {
        String token = buildToken("testuser", "USER", 3_600_000L);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        UserDetails userDetails = buildUserDetails("testuser", "ROLE_USER");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("testuser");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_withValidBearerToken_setsCorrectRole() throws Exception {
        String token = buildToken("adminuser", "ADMIN", 3_600_000L);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        UserDetails userDetails = buildUserDetails("adminuser", "ROLE_ADMIN");
        when(userDetailsService.loadUserByUsername("adminuser")).thenReturn(userDetails);

        filter.doFilterInternal(request, response, filterChain);

        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        assertThat(authorities).anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @Test
    void doFilterInternal_withNoAuthorizationHeader_doesNotSetAuthentication() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void doFilterInternal_withNonBearerHeader_doesNotSetAuthentication() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void doFilterInternal_withExpiredToken_doesNotSetAuthentication() throws Exception {
        String token = buildToken("testuser", "USER", -1000L);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_withInvalidToken_doesNotSetAuthentication() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer not.a.valid.jwt");

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_withTamperedToken_doesNotSetAuthentication() throws Exception {
        String token = buildToken("testuser", "USER", 3_600_000L);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + tampered);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_alwaysCallsFilterChain() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void doFilterInternal_withUserRole_setsUserRole() throws Exception {
        String token = buildToken("moduser", "MODERATOR", 3_600_000L);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        UserDetails userDetails = buildUserDetails("moduser", "ROLE_MODERATOR");
        when(userDetailsService.loadUserByUsername("moduser")).thenReturn(userDetails);

        filter.doFilterInternal(request, response, filterChain);

        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        assertThat(authorities).anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"));
    }

    @Test
    void doFilterInternal_whenUserNotFound_doesNotSetAuthentication() throws Exception {
        String token = buildToken("unknownuser", "USER", 3_600_000L);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(userDetailsService.loadUserByUsername("unknownuser"))
                .thenThrow(new UsernameNotFoundException("User not found"));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    private String buildToken(String username, String role, long expirationOffsetMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationOffsetMs);
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    private UserDetails buildUserDetails(String username, String role) {
        return new User(username, "password", List.of(new SimpleGrantedAuthority(role)));
    }
}
