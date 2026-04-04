package techchamps.io;

import techchamps.io.builder.LoginRequestBuilder;
import techchamps.io.dto.request.LoginRequest;
import techchamps.io.dto.response.LoginResponse;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("POST /api/auth/login")
class AuthControllerIT extends BaseIntegrationTest {

    // ---------------------------------------------------------------
    // Happy path
    // ---------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("Geldige credentials → 200 met success=true en message")
    void login_happyPath_returns200AndSuccessTrue() {
        LoginRequest request = new LoginRequestBuilder().build();

        LoginResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isNotNull();
        assertThat(response.getUsername()).isEqualTo("user");
    }

    @Test
    @Order(2)
    @DisplayName("Geldige credentials → response-body bevat verwacht bericht")
    void login_happyPath_responseMessageIsLoginSuccessful() {
        LoginRequest request = new LoginRequestBuilder().build();

        LoginResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(response.getMessage()).isEqualTo("Login successful");
        assertThat(response.getUsername()).isEqualTo("user");
    }

    @Test
    @Order(3)
    @DisplayName("Geldige credentials → response bevat niet-null JWT token")
    void login_happyPath_returnsNonNullToken() {
        LoginRequest request = new LoginRequestBuilder().build();

        LoginResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(response.getToken()).isNotNull();
    }

    // ---------------------------------------------------------------
    // Unauthorized (401)
    // ---------------------------------------------------------------

    @Test
    @Order(4)
    @DisplayName("Fout wachtwoord → 401 met success=false")
    void login_wrongPassword_returns401AndSuccessFalse() {
        LoginRequest request = new LoginRequestBuilder()
                .password("foutWachtwoord")
                .build();

        LoginResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401)
            .extract().as(LoginResponse.class);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getUsername()).isNull();
    }

    @Test
    @Order(5)
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
    @Order(6)
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
    @Order(7)
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
    // Functionele flow
    // ---------------------------------------------------------------

    @Test
    @Order(8)
    @DisplayName("Flow: geldige login → message klopt → opnieuw inloggen met zelfde credentials slaagt")
    void loginFlow_successfulLoginCanBeRepeated() {
        LoginRequest request = new LoginRequestBuilder().build();

        LoginResponse firstResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(firstResponse.isSuccess()).isTrue();
        String message = firstResponse.getMessage();

        LoginResponse secondResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(secondResponse.isSuccess()).isTrue();
        assertThat(secondResponse.getMessage()).isEqualTo(message);
    }

    @Test
    @Order(9)
    @DisplayName("Flow: mislukte login gevolgd door geldige login slaagt alsnog")
    void loginFlow_failedLoginFollowedByValidLogin_succeeds() {
        LoginResponse failedResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().password("verkeerd").build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401)
            .extract().as(LoginResponse.class);

        assertThat(failedResponse.isSuccess()).isFalse();

        LoginResponse successResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(successResponse.isSuccess()).isTrue();
    }
}
