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
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Role-Based Access Control Integration Tests")
class RoleBasedAccessControlIT extends BaseIntegrationTest {

    private static final String USER = "user";
    private static final String USER_PASSWORD = "user1234";
    private static final String MODERATOR = "moderator";
    private static final String MODERATOR_PASSWORD = "moderator1234";
    private static final String ADMIN = "admin";
    private static final String ADMIN_PASSWORD = "admin1234";

    private Long threadId;
    private Long replyId;

    @BeforeEach
    void setup() {
        // Create a thread as regular user
        threadId = given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
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

        // Create a reply on that thread
        replyId = given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
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
        given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("POST /api/forum/threads/{id}/close — moderator can close thread (200)")
    void closeThread_asModerator_returns200() {
        given()
            .port(port)
            .auth().preemptive().basic(MODERATOR, MODERATOR_PASSWORD)
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
        given()
            .port(port)
            .auth().preemptive().basic(ADMIN, ADMIN_PASSWORD)
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
        // Close the thread as moderator
        given()
            .port(port)
            .auth().preemptive().basic(MODERATOR, MODERATOR_PASSWORD)
            .param("closed", "true")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200);

        // Attempt to reply — should be rejected
        given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
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
        // Close the thread
        given()
            .port(port)
            .auth().preemptive().basic(MODERATOR, MODERATOR_PASSWORD)
            .param("closed", "true")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200);

        // Reopen the thread
        given()
            .port(port)
            .auth().preemptive().basic(MODERATOR, MODERATOR_PASSWORD)
            .param("closed", "false")
        .when()
            .post("/api/forum/threads/{id}/close", threadId)
        .then()
            .statusCode(200)
            .body("closed", equalTo(false));

        // Reply should succeed now
        given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
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
        given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
        .when()
            .delete("/api/forum/replies/{id}", replyId)
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("DELETE /api/forum/replies/{id} — moderator can delete reply (204)")
    void deleteReply_asModerator_returns204() {
        given()
            .port(port)
            .auth().preemptive().basic(MODERATOR, MODERATOR_PASSWORD)
        .when()
            .delete("/api/forum/replies/{id}", replyId)
        .then()
            .statusCode(204);
    }

    @Test
    @DisplayName("DELETE /api/forum/replies/{id} — admin can delete reply (204)")
    void deleteReply_asAdmin_returns204() {
        // Create another reply to delete as admin
        Long anotherReplyId = given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
            .contentType(ContentType.JSON)
            .body(new CreateReplyRequestBuilder()
                .content("Another reply for admin to delete")
                .build())
        .when()
            .post("/api/forum/threads/{id}/replies", threadId)
        .then()
            .statusCode(201)
            .extract().jsonPath().getLong("id");

        given()
            .port(port)
            .auth().preemptive().basic(ADMIN, ADMIN_PASSWORD)
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
        given()
            .port(port)
            .auth().preemptive().basic(USER, USER_PASSWORD)
        .when()
            .get("/api/users")
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("GET /api/users — moderator cannot list users (403)")
    void listUsers_asModerator_returns403() {
        given()
            .port(port)
            .auth().preemptive().basic(MODERATOR, MODERATOR_PASSWORD)
        .when()
            .get("/api/users")
        .then()
            .statusCode(403);
    }

    @Test
    @DisplayName("GET /api/users — admin can list users (200)")
    void listUsers_asAdmin_returns200WithUsers() {
        given()
            .port(port)
            .auth().preemptive().basic(ADMIN, ADMIN_PASSWORD)
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
