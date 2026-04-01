package techchamps.io;

import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@SpringBootTest(
        classes = techchamps.io.BackendApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("CORS configuratie")
class CorsIT {

    @LocalServerPort
    private int port;

    // ---------------------------------------------------------------
    // setAllowedOrigins: exact http://localhost:3000
    // ---------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("setAllowedOrigins: OPTIONS preflight → Access-Control-Allow-Origin is exact http://localhost:3000")
    void setAllowedOrigins_preflight_returnsExactAllowedOrigin() {
        given()
            .port(port)
            .header("Origin", "http://localhost:3000")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "Content-Type")
        .when()
            .options("/api/auth/login")
        .then()
            .statusCode(200)
            .header("Access-Control-Allow-Origin", equalTo("http://localhost:3000"));
    }

    // ---------------------------------------------------------------
    // setAllowedMethods: DELETE is toegestaan
    // ---------------------------------------------------------------

    @Test
    @Order(2)
    @DisplayName("setAllowedMethods: OPTIONS preflight met DELETE → Access-Control-Allow-Methods bevat DELETE")
    void setAllowedMethods_preflightWithDelete_allowMethodsContainsDelete() {
        given()
            .port(port)
            .header("Origin", "http://localhost:3000")
            .header("Access-Control-Request-Method", "DELETE")
        .when()
            .options("/api/auth/login")
        .then()
            .statusCode(200)
            .header("Access-Control-Allow-Methods", containsString("DELETE"));
    }

    // ---------------------------------------------------------------
    // setAllowedHeaders: Content-Type is toegestaan
    // ---------------------------------------------------------------

    @Test
    @Order(3)
    @DisplayName("setAllowedHeaders: OPTIONS preflight met Content-Type → Access-Control-Allow-Headers bevat Content-Type")
    void setAllowedHeaders_preflightWithContentType_allowHeadersContainsContentType() {
        given()
            .port(port)
            .header("Origin", "http://localhost:3000")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "Content-Type")
        .when()
            .options("/api/auth/login")
        .then()
            .statusCode(200)
            .header("Access-Control-Allow-Headers", containsString("Content-Type"));
    }

    // ---------------------------------------------------------------
    // setAllowCredentials: waarde is "true"
    // ---------------------------------------------------------------

    @Test
    @Order(4)
    @DisplayName("setAllowCredentials: OPTIONS preflight → Access-Control-Allow-Credentials is \"true\"")
    void setAllowCredentials_preflight_returnsTrue() {
        given()
            .port(port)
            .header("Origin", "http://localhost:3000")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "Content-Type")
        .when()
            .options("/api/auth/login")
        .then()
            .statusCode(200)
            .header("Access-Control-Allow-Credentials", equalTo("true"));
    }

    // ---------------------------------------------------------------
    // setMaxAge: waarde is aanwezig en niet leeg
    // ---------------------------------------------------------------

    @Test
    @Order(5)
    @DisplayName("setMaxAge: OPTIONS preflight → Access-Control-Max-Age is aanwezig en niet leeg")
    void setMaxAge_preflight_maxAgeHeaderIsPresent() {
        given()
            .port(port)
            .header("Origin", "http://localhost:3000")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "Content-Type")
        .when()
            .options("/api/auth/login")
        .then()
            .statusCode(200)
            .header("Access-Control-Max-Age", notNullValue());
    }

    // ---------------------------------------------------------------
    // registerCorsConfiguration + corsConfigurationSource + corsFilter:
    // gewone POST → Access-Control-Allow-Origin is exact http://localhost:3000
    // ---------------------------------------------------------------

    @Test
    @Order(6)
    @DisplayName("corsFilter: POST van toegestane origin → Access-Control-Allow-Origin is exact http://localhost:3000")
    void corsFilter_postFromAllowedOrigin_returnsExactAllowOriginHeader() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", "http://localhost:3000")
            .body(new techchamps.io.builder.LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .header("Access-Control-Allow-Origin", equalTo("http://localhost:3000"));
    }

    // ---------------------------------------------------------------
    // Niet-toegestane origin: http://evil.com
    // ---------------------------------------------------------------

    @Test
    @Order(7)
    @DisplayName("OPTIONS preflight van niet-toegestane origin → Access-Control-Allow-Origin bevat evil.com NIET")
    void preflight_forbiddenOrigin_doesNotReflectOrigin() {
        String allowOrigin = given()
            .port(port)
            .header("Origin", "http://evil.com")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "Content-Type")
        .when()
            .options("/api/auth/login")
        .then()
            .extract()
            .header("Access-Control-Allow-Origin");

        // De server mag geen "http://evil.com" terugsturen als allowed origin
        org.assertj.core.api.Assertions.assertThat(allowOrigin)
                .as("Niet-toegestane origin mag niet worden gereflecteerd")
                .isNotEqualTo("http://evil.com");
    }
}
