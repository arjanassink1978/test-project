package techchamps.io;

import techchamps.io.builder.CreateReplyRequestBuilder;
import techchamps.io.builder.CreateThreadRequestBuilder;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for role-based access control.
 *
 * Tests authorization rules for moderator and admin actions:
 * - Close/reopen thread (MODERATOR+)
 * - Delete reply (MODERATOR+)
 * - List users (ADMIN only)
 * - Closed thread rejects new replies
 *
 * Authenticated requests use JWT Bearer tokens obtained via {@link BaseIntegrationTest} helpers.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Role-Based Access Control Integration Tests")
class RoleBasedAccessControlIT extends BaseIntegrationTest {

    private Long threadId;
    private Long replyId;

    @BeforeEach
    void setup() {
        String token = userToken();

        threadId = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(new CreateThreadRequestBuilder()
                .title("RBAC Test Thread")
                .description("Thread for role-based access control tests")
                .build())
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .extract().jsonPath().getLong("id");

        replyId = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(new CreateReplyRequestBuilder()
                .content("A reply for RBAC testing")
                .build())
        .when()
            .post("/api/forum/threads/{id}/replies", threadId)
        .then()
            .statusCode(201)
            .extract().jsonPath().getLong("id");
    }

    // -------------------------------------------------------------------------
    // Close thread — authorization
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/forum/threads/{id}/close — user cannot close thread (403)")
    void closeThread_asUser_returns403() {
        String token = userToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("POST /api/forum/threads/{id}/close — moderator can close thread (200)")
    void closeThread_asModerator_returns200() {
        String token = moderatorToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .param("closed", "true")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200)
            .body("closed", equalTo(true));
    }

    @Test
    @DisplayName("POST /api/forum/threads/{id}/close — admin can close thread (200)")
    void closeThread_asAdmin_returns200() {
        String token = adminToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .param("closed", "true")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200)
            .body("closed", equalTo(true));
    }

    @Test
    @DisplayName("POST /api/forum/threads/{id}/close — unauthenticated returns 401")
    void closeThread_unauthenticated_returns401() {
        given()
            .port(port)
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(401);
    }

    // -------------------------------------------------------------------------
    // Closed thread rejects new replies
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Closed thread — replying returns 403")
    void replyToClosedThread_returns403() {
        String modToken = moderatorToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + modToken)
            .param("closed", "true")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200);

        String userToken = userToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + userToken)
            .contentType(ContentType.JSON)
            .body(new CreateReplyRequestBuilder()
                .content("Trying to reply to closed thread")
                .build())
        .when()
            .post("/api/forum/threads/{id}/replies", threadId)
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("Reopened thread — replying succeeds (201)")
    void replyToReopenedThread_returns201() {
        String modToken = moderatorToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + modToken)
            .param("closed", "true")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200);

        given()
            .port(port)
            .header("Authorization", "Bearer " + modToken)
            .param("closed", "false")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200)
            .body("closed", equalTo(false));

        String userToken = userToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + userToken)
            .contentType(ContentType.JSON)
            .body(new CreateReplyRequestBuilder()
                .content("Reply after reopen")
                .build())
        .when()
            .post("/api/forum/threads/{id}/replies", threadId)
        .then()
            .statusCode(201);
    }

    // -------------------------------------------------------------------------
    // Delete reply — authorization
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("DELETE /api/forum/replies/{id} — user cannot delete reply (403)")
    void deleteReply_asUser_returns403() {
        String token = userToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .delete("/api/forum/replies/{id}", replyId)
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("DELETE /api/forum/replies/{id} — moderator can delete reply (204)")
    void deleteReply_asModerator_returns204() {
        String token = moderatorToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .delete("/api/forum/replies/{id}", replyId)
        .then()
            .statusCode(204);
    }

    @Test
    @DisplayName("DELETE /api/forum/replies/{id} — admin can delete reply (204)")
    void deleteReply_asAdmin_returns204() {
        String userToken = userToken();
        Long anotherReplyId = given()
            .port(port)
            .header("Authorization", "Bearer " + userToken)
            .contentType(ContentType.JSON)
            .body(new CreateReplyRequestBuilder()
                .content("Another reply for admin to delete")
                .build())
        .when()
            .post("/api/forum/threads/{id}/replies", threadId)
        .then()
            .statusCode(201)
            .extract().jsonPath().getLong("id");

        String adminToken = adminToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
        .when()
            .delete("/api/forum/replies/{id}", anotherReplyId)
        .then()
            .statusCode(204);
    }

    @Test
    @DisplayName("DELETE /api/forum/replies/{id} — unauthenticated returns 401")
    void deleteReply_unauthenticated_returns401() {
        given()
            .port(port)
        .when()
            .delete("/api/forum/replies/{id}", replyId)
        .then()
            .statusCode(401);
    }

    // -------------------------------------------------------------------------
    // List users — ADMIN only
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/users — user cannot list users (403)")
    void listUsers_asUser_returns403() {
        String token = userToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .get("/api/users")
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("GET /api/users — moderator cannot list users (403)")
    void listUsers_asModerator_returns403() {
        String token = moderatorToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .get("/api/users")
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("GET /api/users — admin can list users (200)")
    void listUsers_asAdmin_returns200WithUsers() {
        String token = adminToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .get("/api/users")
        .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(3))
            .body("find { it.username == 'user' }.role", equalTo("USER"))
            .body("find { it.username == 'moderator' }.role", equalTo("MODERATOR"))
            .body("find { it.username == 'admin' }.role", equalTo("ADMIN"));
    }

    @Test
    @DisplayName("GET /api/users — unauthenticated returns 401")
    void listUsers_unauthenticated_returns401() {
        given()
            .port(port)
        .when()
            .get("/api/users")
        .then()
            .statusCode(401);
    }
}
