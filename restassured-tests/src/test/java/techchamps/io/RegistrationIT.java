package techchamps.io;

import techchamps.io.builder.RegisterRequestBuilder;
import techchamps.io.dto.request.RegisterRequest;
import techchamps.io.dto.request.LoginRequest;
import techchamps.io.dto.response.RegisterResponse;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.assertj.core.api.Assertions.assertThat;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("POST /api/auth/register")
class RegistrationIT extends BaseIntegrationTest {

    private static final String ORIGIN = "http://localhost:3000";

    // ---------------------------------------------------------------
    // Happy path: Successful Registration
    // ---------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("Geldige email, username, password → 200 met user details")
    void register_validData_returns200WithUserDetails() {
        RegisterRequest request = new RegisterRequestBuilder()
                .email("alice@example.com")
                .username("alice")
                .password("securePass123")
                .build();

        Response response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("message", equalTo("Registration successful"))
            .body("id", notNullValue())
            .body("email", equalTo("alice@example.com"))
            .body("username", equalTo("alice"))
            .extract()
            .response();

        RegisterResponse body = response.as(RegisterResponse.class);
        assertThat(body.getId()).isNotNull().isGreaterThan(0);
        assertThat(body.getEmail()).isEqualTo("alice@example.com");
        assertThat(body.getUsername()).isEqualTo("alice");
        assertThat(body.isSuccess()).isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("Registration response bevat id, email, username, success en message velden")
    void register_validData_responseHasAllRequiredFields() {
        RegisterRequest request = new RegisterRequestBuilder()
                .email("bob@example.com")
                .username("bob")
                .password("anotherPass456")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .body("id", notNullValue())
            .body("email", notNullValue())
            .body("username", notNullValue())
            .body("success", notNullValue())
            .body("message", notNullValue());
    }

    // ---------------------------------------------------------------
    // Validation Errors: 400 Bad Request
    // ---------------------------------------------------------------

    @Test
    @Order(3)
    @DisplayName("Missing email field → 400 Bad Request")
    void register_missingEmail_returns400() {
        RegisterRequest request = new RegisterRequest(null, "testuser", "securePass123");

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(4)
    @DisplayName("Missing username field → 400 Bad Request")
    void register_missingUsername_returns400() {
        RegisterRequest request = new RegisterRequest("charlie@example.com", null, "securePass123");

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(5)
    @DisplayName("Missing password field → 400 Bad Request")
    void register_missingPassword_returns400() {
        RegisterRequest request = new RegisterRequest("david@example.com", "david", null);

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(6)
    @DisplayName("Invalid email format (notanemail) → 400 Bad Request")
    void register_invalidEmailFormat_returns400() {
        RegisterRequest request = new RegisterRequestBuilder()
                .email("notanemail")
                .username("testuser")
                .password("securePass123")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(7)
    @DisplayName("Password too short (< 8 characters) → 400 Bad Request")
    void register_passwordTooShort_returns400() {
        RegisterRequest request = new RegisterRequestBuilder()
                .email("shortpass@example.com")
                .username("shortpassuser")
                .password("Pass12")  // Only 6 characters
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(8)
    @DisplayName("Username too short (< 3 characters) → 400 Bad Request")
    void register_usernameTooShort_returns400() {
        RegisterRequest request = new RegisterRequestBuilder()
                .email("shortuser@example.com")
                .username("ab")  // Only 2 characters
                .password("securePass123")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400);
    }

    // ---------------------------------------------------------------
    // Duplicate Detection: 409 Conflict
    // ---------------------------------------------------------------

    @Test
    @Order(9)
    @DisplayName("Register twice with same email → second returns 409 Conflict")
    void register_duplicateEmail_returns409() {
        String email = "duplicate@example.com";
        RegisterRequest firstRequest = new RegisterRequestBuilder()
                .email(email)
                .username("firstuser")
                .password("securePass123")
                .build();

        // First registration should succeed
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(firstRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200);

        // Second registration with same email should fail
        RegisterRequest secondRequest = new RegisterRequestBuilder()
                .email(email)
                .username("seconduser")
                .password("securePass123")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(secondRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("message", equalTo("Email address is already in use"));
    }

    @Test
    @Order(10)
    @DisplayName("Register twice with same username → second returns 409 Conflict")
    void register_duplicateUsername_returns409() {
        String username = "duplicateuser";
        RegisterRequest firstRequest = new RegisterRequestBuilder()
                .email("first@example.com")
                .username(username)
                .password("securePass123")
                .build();

        // First registration should succeed
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(firstRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200);

        // Second registration with same username should fail
        RegisterRequest secondRequest = new RegisterRequestBuilder()
                .email("second@example.com")
                .username(username)
                .password("securePass123")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(secondRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("message", equalTo("Username is already in use"));
    }

    @Test
    @Order(11)
    @DisplayName("Register with both duplicate email and username → 409 Conflict (email checked first)")
    void register_duplicateEmailAndUsername_returns409() {
        String email = "both@example.com";
        String username = "bothuser";

        RegisterRequest firstRequest = new RegisterRequestBuilder()
                .email(email)
                .username(username)
                .password("securePass123")
                .build();

        // First registration should succeed
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(firstRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200);

        // Second registration with both duplicate email and username should fail with email conflict
        RegisterRequest secondRequest = new RegisterRequestBuilder()
                .email(email)
                .username(username)
                .password("securePass123")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(secondRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("message", equalTo("Email address is already in use"));
    }

    // ---------------------------------------------------------------
    // Integration Workflow Tests
    // ---------------------------------------------------------------

    @Test
    @Order(12)
    @DisplayName("Register new user → Login with same credentials succeeds")
    void registrationWorkflow_registerThenLogin_succeeds() {
        String email = "workflow1@example.com";
        String username = "workflow1user";
        String password = "securePass123";

        // Register new user
        Response registerResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new RegisterRequestBuilder()
                .email(email)
                .username(username)
                .password(password)
                .build())
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .extract()
            .response();

        RegisterResponse regBody = registerResponse.as(RegisterResponse.class);
        assertThat(regBody.getId()).isNotNull().isGreaterThan(0);

        // Login with registered credentials should succeed
        LoginRequest loginRequest = new LoginRequest(username, password);
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(loginRequest)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("message", equalTo("Login successful"));
    }

    @Test
    @Order(13)
    @DisplayName("Multiple independent registrations → all succeed and are independently accessible")
    void registrationWorkflow_multipleRegistrationsAndLogins_allSucceed() {
        // Register first user
        String email1 = "multi1@example.com";
        String username1 = "multiuser1";
        String password1 = "securePass123";

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new RegisterRequestBuilder()
                .email(email1)
                .username(username1)
                .password(password1)
                .build())
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));

        // Register second user
        String email2 = "multi2@example.com";
        String username2 = "multiuser2";
        String password2 = "anotherPass456";

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new RegisterRequestBuilder()
                .email(email2)
                .username(username2)
                .password(password2)
                .build())
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));

        // Login as first user should succeed
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new LoginRequest(username1, password1))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));

        // Login as second user should succeed
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new LoginRequest(username2, password2))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));

        // Attempting to login as first user again should still work (stateless)
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new LoginRequest(username1, password1))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("success", equalTo(true));
    }
}
