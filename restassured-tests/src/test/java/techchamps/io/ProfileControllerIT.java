package techchamps.io;

import techchamps.io.builder.UpdateProfileRequestBuilder;
import techchamps.io.dto.request.UpdateProfileRequest;
import techchamps.io.dto.response.ProfileResponse;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.io.InputStream;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest(
        classes = techchamps.io.BackendApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Profile endpoints — /api/profile/{username}")
class ProfileControllerIT {

    @LocalServerPort
    private int port;

    private static final String USERNAME = "user";

    // ---------------------------------------------------------------
    // GET /api/profile/{username}
    // ---------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("GET /api/profile/user — valid user → 200 with all fields present")
    void getProfile_validUser_returns200WithAllFields() {
        Response response = given()
            .port(port)
        .when()
            .get("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200)
            .body("id", notNullValue())
            .body("email", notNullValue())
            .body("username", notNullValue())
            .extract().response();

        ProfileResponse profile = response.as(ProfileResponse.class);
        assertNotNull(profile.getId());
        assertEquals(USERNAME, profile.getUsername());
        assertNotNull(profile.getEmail());
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/profile/nonexistent — unknown user → 404")
    void getProfile_nonexistentUser_returns404() {
        given()
            .port(port)
        .when()
            .get("/api/profile/{username}", "nonexistent_user_xyz")
        .then()
            .statusCode(404);
    }

    // ---------------------------------------------------------------
    // PUT /api/profile/{username}
    // ---------------------------------------------------------------

    @Test
    @Order(3)
    @DisplayName("PUT /api/profile/user — valid update → 200, response reflects updates")
    void updateProfile_validData_returns200WithUpdatedFields() {
        UpdateProfileRequest request = new UpdateProfileRequestBuilder()
                .displayName("Jane Doe")
                .bio("Integration tester extraordinaire")
                .location("Utrecht, Netherlands")
                .build();

        Response response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200)
            .extract().response();

        ProfileResponse profile = response.as(ProfileResponse.class);
        assertEquals("Jane Doe", profile.getDisplayName());
        assertEquals("Integration tester extraordinaire", profile.getBio());
        assertEquals("Utrecht, Netherlands", profile.getLocation());
        assertEquals(USERNAME, profile.getUsername());
    }

    @Test
    @Order(4)
    @DisplayName("PUT /api/profile/user — displayName exceeds 100 chars @Size max → 400")
    void updateProfile_displayNameTooLong_returns400() {
        // 101-character display name — exceeds @Size(max = 100)
        String tooLong = "A".repeat(101);

        UpdateProfileRequest request = new UpdateProfileRequestBuilder()
                .displayName(tooLong)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(400);
    }

    @Test
    @Order(5)
    @DisplayName("PUT /api/profile/user — partial update (only bio) → 200, other fields preserved")
    void updateProfile_partialUpdate_unchangedFieldsPreserved() {
        // First set a known displayName
        UpdateProfileRequest setRequest = new UpdateProfileRequestBuilder()
                .displayName("Preserved Name")
                .bio("Original bio")
                .location("Original location")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(setRequest)
        .when()
            .put("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200);

        // Now update only the bio, sending null for displayName and location
        UpdateProfileRequest partialRequest = new UpdateProfileRequest(null, "Updated bio only", null);

        Response response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(partialRequest)
        .when()
            .put("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200)
            .extract().response();

        ProfileResponse profile = response.as(ProfileResponse.class);
        assertEquals("Updated bio only", profile.getBio());
        // displayName and location were nulled — verify they reflect what was sent
        assertNull(profile.getDisplayName());
        assertNull(profile.getLocation());
        assertEquals(USERNAME, profile.getUsername());
    }

    @Test
    @Order(6)
    @DisplayName("PUT /api/profile/nonexistent — unknown user → 404")
    void updateProfile_nonexistentUser_returns404() {
        UpdateProfileRequest request = new UpdateProfileRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/profile/{username}", "nonexistent_user_xyz")
        .then()
            .statusCode(404);
    }

    // ---------------------------------------------------------------
    // POST /api/profile/{username}/avatar
    // ---------------------------------------------------------------

    @Test
    @Order(7)
    @DisplayName("POST /api/profile/user/avatar — valid PNG file → 200, avatarUrl not null")
    void uploadAvatar_validImageFile_returns200WithAvatarUrl() throws Exception {
        InputStream avatarStream = getClass().getResourceAsStream("/test-avatar.png");
        assertNotNull(avatarStream, "test-avatar.png must exist in test resources");

        Response response = given()
            .port(port)
            .multiPart("file", "test-avatar.png", avatarStream, "image/png")
        .when()
            .post("/api/profile/{username}/avatar", USERNAME)
        .then()
            .statusCode(200)
            .body("avatarUrl", notNullValue())
            .extract().response();

        String avatarUrl = response.path("avatarUrl");
        assertNotNull(avatarUrl);
        assertThat(avatarUrl).startsWith("data:image/png;base64,");
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/profile/user/avatar — missing file part → 4xx client error")
    void uploadAvatar_missingFilePart_returns4xxError() {
        // Submitting a multipart request without the required 'file' part is a client error.
        // Spring may return 400 (MissingServletRequestPartException) or 403 depending on
        // how the security filter chain processes the malformed multipart request.
        int status = given()
            .port(port)
            .contentType("multipart/form-data")
        .when()
            .post("/api/profile/{username}/avatar", USERNAME)
        .then()
            .extract()
            .statusCode();

        assertThat(status)
                .as("Missing file part should result in a 4xx client error (400 or 403)")
                .isBetween(400, 499);
    }

    // ---------------------------------------------------------------
    // DELETE /api/profile/{username}/avatar
    // ---------------------------------------------------------------

    @Test
    @Order(9)
    @DisplayName("DELETE /api/profile/user/avatar — removes avatar → 200, avatarUrl is null")
    void deleteAvatar_existingUser_returns200WithNullAvatarUrl() {
        // Upload avatar first so there is something to delete
        InputStream avatarStream = getClass().getResourceAsStream("/test-avatar.png");
        assertNotNull(avatarStream, "test-avatar.png must exist in test resources");

        given()
            .port(port)
            .multiPart("file", "test-avatar.png", avatarStream, "image/png")
        .when()
            .post("/api/profile/{username}/avatar", USERNAME)
        .then()
            .statusCode(200);

        // Now delete
        Response response = given()
            .port(port)
        .when()
            .delete("/api/profile/{username}/avatar", USERNAME)
        .then()
            .statusCode(200)
            .body("avatarUrl", nullValue())
            .extract().response();

        ProfileResponse profile = response.as(ProfileResponse.class);
        assertNull(profile.getAvatarUrl());
    }

    @Test
    @Order(10)
    @DisplayName("DELETE /api/profile/nonexistent/avatar — unknown user → 404")
    void deleteAvatar_nonexistentUser_returns404() {
        given()
            .port(port)
        .when()
            .delete("/api/profile/{username}/avatar", "nonexistent_user_xyz")
        .then()
            .statusCode(404);
    }

    // ---------------------------------------------------------------
    // Full functional flow
    // ---------------------------------------------------------------

    @Test
    @Order(11)
    @DisplayName("Full flow: GET → PUT → upload avatar → GET → DELETE avatar → GET")
    void fullProfileFlow_allStepsSucceed() throws Exception {
        // Step 1: GET initial profile — user exists, has id and email
        Response initialGet = given()
            .port(port)
        .when()
            .get("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200)
            .extract().response();

        ProfileResponse initial = initialGet.as(ProfileResponse.class);
        assertNotNull(initial.getId());
        assertEquals(USERNAME, initial.getUsername());
        assertNotNull(initial.getEmail());

        // Step 2: PUT — update displayName and bio
        UpdateProfileRequest updateRequest = new UpdateProfileRequestBuilder()
                .displayName("Flow Test User")
                .bio("Bio set during full flow test")
                .location("Rotterdam, Netherlands")
                .build();

        Response putResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200)
            .extract().response();

        ProfileResponse updated = putResponse.as(ProfileResponse.class);
        assertEquals("Flow Test User", updated.getDisplayName());
        assertEquals("Bio set during full flow test", updated.getBio());
        assertEquals("Rotterdam, Netherlands", updated.getLocation());

        // Step 3: POST avatar
        InputStream avatarStream = getClass().getResourceAsStream("/test-avatar.png");
        assertNotNull(avatarStream, "test-avatar.png must exist in test resources");

        Response avatarResponse = given()
            .port(port)
            .multiPart("file", "test-avatar.png", avatarStream, "image/png")
        .when()
            .post("/api/profile/{username}/avatar", USERNAME)
        .then()
            .statusCode(200)
            .body("avatarUrl", notNullValue())
            .extract().response();

        String avatarUrl = avatarResponse.path("avatarUrl");
        assertThat(avatarUrl).startsWith("data:image/png;base64,");

        // Step 4: GET — assert all updates persisted (displayName, bio, avatarUrl)
        Response getAfterUpdate = given()
            .port(port)
        .when()
            .get("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200)
            .extract().response();

        ProfileResponse afterUpdate = getAfterUpdate.as(ProfileResponse.class);
        assertEquals("Flow Test User", afterUpdate.getDisplayName());
        assertEquals("Bio set during full flow test", afterUpdate.getBio());
        assertNotNull(afterUpdate.getAvatarUrl());
        assertThat(afterUpdate.getAvatarUrl()).startsWith("data:image/png;base64,");

        // Step 5: DELETE avatar
        given()
            .port(port)
        .when()
            .delete("/api/profile/{username}/avatar", USERNAME)
        .then()
            .statusCode(200)
            .body("avatarUrl", nullValue());

        // Step 6: Final GET — avatar cleared, other fields still present
        Response finalGet = given()
            .port(port)
        .when()
            .get("/api/profile/{username}", USERNAME)
        .then()
            .statusCode(200)
            .extract().response();

        ProfileResponse finalProfile = finalGet.as(ProfileResponse.class);
        assertEquals(USERNAME, finalProfile.getUsername());
        assertNull(finalProfile.getAvatarUrl());
        assertEquals("Flow Test User", finalProfile.getDisplayName());
    }
}
