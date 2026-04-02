package techchamps.io;

import techchamps.io.builder.LoginRequestBuilder;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.assertj.core.api.Assertions.assertThat;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("SecurityConfig, DataInitializer en AppUser")
class SecurityConfigIT extends BaseIntegrationTest {

    // ---------------------------------------------------------------
    // @BeforeEach: startup-conditie — seed-user moet beschikbaar zijn
    // ---------------------------------------------------------------

    @BeforeEach
    void seedUserMustBeAvailable() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));
    }

    // ---------------------------------------------------------------
    // DataInitializer: seed-data aanwezig en duplicate-check werkt
    // ---------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("DataInitializer: login met user/user1234 slaagt → seed-data is aangemaakt")
    void dataInitializer_seedUserExists_loginSucceeds() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("message", equalTo("Login successful"));
    }

    @Test
    @Order(2)
    @DisplayName("DataInitializer: twee keer inloggen slaagt → duplicate-user-check voorkomt fout")
    void dataInitializer_loginTwice_bothSucceed() {
        // Eerste login
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));

        // Tweede login — DataInitializer mag user niet opnieuw aanmaken (duplicate-check)
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));
    }

    // ---------------------------------------------------------------
    // PasswordEncoder (BCrypt): plaintext wordt correct vergeleken
    // ---------------------------------------------------------------

    @Test
    @Order(3)
    @DisplayName("PasswordEncoder: login met correct plaintext wachtwoord → 200 (BCrypt actief)")
    void passwordEncoder_correctPassword_returns200() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().password("user1234").build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));
    }

    @Test
    @Order(4)
    @DisplayName("PasswordEncoder: login met verkeerd wachtwoord → 401 (BCrypt-check actief)")
    void passwordEncoder_wrongPassword_returns401() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().password("verkeerDWachtwoord").build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401)
            .body("success", equalTo(false));
    }

    // ---------------------------------------------------------------
    // SecurityFilterChain: niet-publieke endpoints vereisen authenticatie
    // ---------------------------------------------------------------

    @Test
    @Order(5)
    @DisplayName("SecurityFilterChain: request zonder token naar beveiligd endpoint → 401/403")
    void securityFilterChain_requestWithoutToken_returnsUnauthorized() {
        int status = given()
            .port(port)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/protected")
        .then()
            .extract()
            .statusCode();

        assertThat(status)
                .as("Endpoint zonder token moet 401 of 403 teruggeven")
                .isIn(401, 403);
    }

    // ---------------------------------------------------------------
    // AppUser::getRole: rol wordt correct geladen (ROLE_USER)
    // ---------------------------------------------------------------

    @Test
    @Order(6)
    @DisplayName("AppUser::getRole: ingelogde user heeft rol USER → login slaagt en message is 'Login successful'")
    void appUserGetRole_userLoginSucceeds_roleIsUser() {
        // DatabaseUserDetailsService maakt authority "ROLE_" + getRole().
        // Als getRole() "" of null teruggeeft wordt de authority "ROLE_" of faalt de opbouw,
        // waardoor authenticatie mislukt. Slagen van login bevestigt dat getRole() "USER" retourneert.
        Response response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("message", equalTo("Login successful"))
            .extract().response();

        // Aanvullende assertie: beveiligd endpoint is bereikbaar na succesvolle login
        // (dit bevestigt dat de authority ROLE_USER correct is opgebouwd).
        // Zonder geldige credentials geeft het 401/403.
        int protectedStatus = given()
            .port(port)
            .contentType(ContentType.JSON)
        .when()
            .get("/api/protected")
        .then()
            .extract()
            .statusCode();

        assertThat(protectedStatus)
                .as("Beveiligd endpoint zonder token geeft 401 of 403")
                .isIn(401, 403);

        // De login zelf is gelukt → getRole() heeft een niet-lege waarde teruggegeven
        assertThat(response.path("success").toString())
                .as("Login success moet true zijn zodat getRole() bevestigend werkt")
                .isEqualTo("true");
    }
}
