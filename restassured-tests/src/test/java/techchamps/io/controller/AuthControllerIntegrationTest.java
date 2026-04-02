package techchamps.io.controller;

import techchamps.io.BaseIntegrationTest;
import techchamps.io.builder.LoginRequestBuilder;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

/**
 * Bestaande integratietests herschreven met LoginRequestBuilder.
 * De uitgebreide testsuite staat in AuthControllerIT.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("AuthController – basis smoke tests")
class AuthControllerIntegrationTest extends BaseIntegrationTest {

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

    @Test
    @Order(1)
    @DisplayName("Geldige credentials → 200 en success=true")
    void loginWithValidCredentials_shouldReturn200AndSuccessTrue() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("username", equalTo("user"));
    }

    @Test
    @Order(2)
    @DisplayName("Fout wachtwoord → 401 en success=false")
    void loginWithWrongPassword_shouldReturn401AndSuccessFalse() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().password("foutWachtwoord").build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("username", nullValue());
    }

    @Test
    @Order(3)
    @DisplayName("Onbekende gebruiker → 401")
    void loginWithUnknownUser_shouldReturn401() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequestBuilder().username("onbekend").password("whatever").build())
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401);
    }
}
