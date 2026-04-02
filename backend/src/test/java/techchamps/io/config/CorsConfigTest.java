package techchamps.io.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    private CorsConfig corsConfig;

    @BeforeEach
    void setUp() {
        corsConfig = new CorsConfig();
    }

    // --- corsConfigurationSource() not null (kills NULL_RETURN on line 26) ---

    @Test
    void corsConfigurationSource_returnsNonNull() {
        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        assertThat(source).isNotNull();
    }

    // --- setAllowedOrigins (kills VOID_METHOD_CALL on line 18) ---

    @Test
    void corsConfigurationSource_allowsLocalhostOrigin() {
        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/test");
        request.addHeader("Origin", "http://localhost:3000");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.checkOrigin("http://localhost:3000")).isEqualTo("http://localhost:3000");
    }

    @Test
    void corsConfigurationSource_doesNotAllowUnknownOrigin() {
        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/test");
        request.addHeader("Origin", "http://evil.com");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.checkOrigin("http://evil.com")).isNull();
    }

    // --- setAllowedMethods (kills VOID_METHOD_CALL on line 19) ---

    @Test
    void corsConfigurationSource_allowsGetMethod() {
        CorsConfiguration config = getConfig();
        assertThat(config.getAllowedMethods()).contains("GET");
    }

    @Test
    void corsConfigurationSource_allowsDeleteMethod() {
        CorsConfiguration config = getConfig();
        assertThat(config.getAllowedMethods()).contains("DELETE");
    }

    @Test
    void corsConfigurationSource_allowsPostMethod() {
        CorsConfiguration config = getConfig();
        assertThat(config.getAllowedMethods()).contains("POST");
    }

    // --- setAllowedHeaders (kills VOID_METHOD_CALL on line 20) ---

    @Test
    void corsConfigurationSource_allowsAllHeaders() {
        CorsConfiguration config = getConfig();
        assertThat(config.getAllowedHeaders()).isNotEmpty();
        // "*" wildcard configured — checkHeaders should return non-null for any header
        assertThat(config.checkHeaders(java.util.List.of("Content-Type", "Authorization")))
                .isNotNull();
    }

    // --- setAllowCredentials (kills VOID_METHOD_CALL on line 21) ---

    @Test
    void corsConfigurationSource_allowCredentialsIsTrue() {
        CorsConfiguration config = getConfig();
        assertThat(config.getAllowCredentials()).isTrue();
    }

    // --- setMaxAge (kills VOID_METHOD_CALL on line 22) ---

    @Test
    void corsConfigurationSource_maxAgeIsSet() {
        CorsConfiguration config = getConfig();
        assertThat(config.getMaxAge()).isNotNull().isGreaterThan(0L);
    }

    // --- registerCorsConfiguration (kills VOID_METHOD_CALL on line 25) ---

    @Test
    void corsConfigurationSource_registersConfigForAllPaths() {
        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/some/deep/path");
        request.addHeader("Origin", "http://localhost:3000");
        // If registerCorsConfiguration is removed, getCorsConfiguration returns null
        assertThat(source.getCorsConfiguration(request)).isNotNull();
    }

    // --- helper ---

    private CorsConfiguration getConfig() {
        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/test");
        request.addHeader("Origin", "http://localhost:3000");
        return source.getCorsConfiguration(request);
    }
}
