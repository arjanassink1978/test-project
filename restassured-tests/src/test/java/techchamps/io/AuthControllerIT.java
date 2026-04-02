package techchamps.io;

import techchamps.io.builder.LoginRequestBuilder;
import techchamps.io.dto.request.LoginRequest;
import techchamps.io.dto.response.LoginResponse;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("POST /api/auth/login")
class AuthControllerIT extends BaseIntegrationTest {

    // ---------------------------------------------------------------
    // Setup: Ensure seed user exists before tests
    // ---------------------------------------------------------------

    @BeforeEach
    void ensureSeedUserExists() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200);
    }

    // ---------------------------------------------------------------
    // Happy path
    // ---------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("Geldige credentials → 200 met success=true en message")
    void login_happyPath_returns200AndSuccessTrue() {
        LoginRequest request = new LoginRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("message", notNullValue())
            .body("username", equalTo("user"));
    }

    @Test
    @Order(2)
    @DisplayName("Geldige credentials → response-body bevat verwacht bericht")
    void login_happyPath_responseMessageIsLoginSuccessful() {
        LoginRequest request = new LoginRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("message", equalTo("Login successful"))
            .body("username", equalTo("user"));
    }

    // ---------------------------------------------------------------
    // Unauthorized (401)
    // ---------------------------------------------------------------

    @Test
    @Order(3)
    @DisplayName("Fout wachtwoord → 401 met success=false")
    void login_wrongPassword_returns401AndSuccessFalse() {
        LoginRequest request = new LoginRequestBuilder()
                .password("foutWachtwoord")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("username", nullValue());
    }

    @Test
    @Order(4)
    @DisplayName("Onbekende gebruiker → 401")
    void login_unknownUser_returns401() {
        LoginRequest request = new LoginRequestBuilder()
                .username("onbekend")
                .password("whatever")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(5)
    @DisplayName("Leeg wachtwoord → 401")
    void login_emptyPassword_returns401() {
        LoginRequest request = new LoginRequestBuilder()
                .password("")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(6)
    @DisplayName("Lege gebruikersnaam → 401")
    void login_emptyUsername_returns401() {
        LoginRequest request = new LoginRequestBuilder()
                .username("")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401);
    }

    // ---------------------------------------------------------------
    // Functionele flow: inloggen en valideren dat token/bericht herbruikbaar is
    // ---------------------------------------------------------------

    @Test
    @Order(7)
    @DisplayName("Flow: geldige login → message klopt → opnieuw inloggen met zelfde credentials slaagt")
    void loginFlow_successfulLoginCanBeRepeated() {
        LoginRequest request = new LoginRequestBuilder().build();

        // Eerste login
        String message = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .extract()
            .path("message");

        // Tweede login met zelfde credentials – stateless server, moet opnieuw slagen
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("message", equalTo(message));
    }

    @Test
    @Order(8)
    @DisplayName("Flow: mislukte login gevolgd door geldige login slaagt alsnog")
    void loginFlow_failedLoginFollowedByValidLogin_succeeds() {
        // Mislukte poging
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().password("verkeerd").build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401)
            .body("success", equalTo(false));

        // Geldige poging direct erna
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
}
