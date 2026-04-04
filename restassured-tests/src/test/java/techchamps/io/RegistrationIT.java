package techchamps.io;

import techchamps.io.builder.LoginRequestBuilder;
import techchamps.io.builder.RegisterRequestBuilder;
import techchamps.io.dto.request.RegisterRequest;
import techchamps.io.dto.request.LoginRequest;
import techchamps.io.dto.response.RegisterResponse;
import techchamps.io.dto.response.LoginResponse;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
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

        RegisterResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .extract().as(RegisterResponse.class);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Registration successful");
        assertThat(response.getId()).isNotNull().isGreaterThan(0);
        assertThat(response.getEmail()).isEqualTo("alice@example.com");
        assertThat(response.getUsername()).isEqualTo("alice");
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

        RegisterResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .extract().as(RegisterResponse.class);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getEmail()).isNotNull();
        assertThat(response.getUsername()).isNotNull();
        assertThat(response.isSuccess()).isNotNull();
        assertThat(response.getMessage()).isNotNull();
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

        RegisterResponse duplicateResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(secondRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(409)
            .extract().as(RegisterResponse.class);

        assertThat(duplicateResponse.isSuccess()).isFalse();
        assertThat(duplicateResponse.getMessage()).isEqualTo("Email address is already in use");
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

        RegisterResponse duplicateResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(secondRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(409)
            .extract().as(RegisterResponse.class);

        assertThat(duplicateResponse.isSuccess()).isFalse();
        assertThat(duplicateResponse.getMessage()).isEqualTo("Username is already in use");
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

        RegisterResponse duplicateResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(secondRequest)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(409)
            .extract().as(RegisterResponse.class);

        assertThat(duplicateResponse.isSuccess()).isFalse();
        assertThat(duplicateResponse.getMessage()).isEqualTo("Email address is already in use");
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
        RegisterResponse registerResponse = given()
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
            .extract().as(RegisterResponse.class);

        assertThat(registerResponse.isSuccess()).isTrue();
        assertThat(registerResponse.getId()).isNotNull().isGreaterThan(0);

        // Login with registered credentials should succeed
        LoginRequest loginRequest = new LoginRequest(username, password);
        LoginResponse loginResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(loginRequest)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(loginResponse.isSuccess()).isTrue();
        assertThat(loginResponse.getMessage()).isEqualTo("Login successful");
    }

    @Test
    @Order(13)
    @DisplayName("Multiple independent registrations → all succeed and are independently accessible")
    void registrationWorkflow_multipleRegistrationsAndLogins_allSucceed() {
        // Register first user
        String email1 = "multi1@example.com";
        String username1 = "multiuser1";
        String password1 = "securePass123";

        RegisterResponse registerResponse1 = given()
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
            .extract().as(RegisterResponse.class);

        assertThat(registerResponse1.isSuccess()).isTrue();

        // Register second user
        String email2 = "multi2@example.com";
        String username2 = "multiuser2";
        String password2 = "anotherPass456";

        RegisterResponse registerResponse2 = given()
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
            .extract().as(RegisterResponse.class);

        assertThat(registerResponse2.isSuccess()).isTrue();

        // Login as first user should succeed
        LoginResponse loginResponse1 = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new LoginRequest(username1, password1))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(loginResponse1.isSuccess()).isTrue();

        // Login as second user should succeed
        LoginResponse loginResponse2 = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new LoginRequest(username2, password2))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(loginResponse2.isSuccess()).isTrue();

        // Attempting to login as first user again should still work (stateless)
        LoginResponse loginResponse3 = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Origin", ORIGIN)
            .body(new LoginRequest(username1, password1))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract().as(LoginResponse.class);

        assertThat(loginResponse3.isSuccess()).isTrue();
    }
}
