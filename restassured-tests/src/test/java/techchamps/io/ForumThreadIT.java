package techchamps.io;

import techchamps.io.builder.CreateReplyRequestBuilder;
import techchamps.io.builder.CreateThreadRequestBuilder;
import techchamps.io.builder.RegisterRequestBuilder;
import techchamps.io.dto.request.CreateReplyRequest;
import techchamps.io.dto.request.CreateThreadRequest;
import techchamps.io.dto.request.VoteRequest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for Forum endpoints.
 *
 * All tests extend BaseIntegrationTest (provides @SpringBootTest + @LocalServerPort).
 * Authenticated requests use HTTP Basic auth with the seeded user (user/user1234).
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Forum API Integration Tests")
class ForumThreadIT extends BaseIntegrationTest {

    private static final String USER = "user";
    private static final String PASSWORD = "user1234";

    // -------------------------------------------------------------------------
    // Categories
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("GET /api/forum/categories → 200 with at least 1 category")
    void getCategories_returns200AndList() {
        given()
            .port(port)
        .when()
            .get("/api/forum/categories")
        .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1))
            .body("[0].id", notNullValue())
            .body("[0].name", notNullValue());
    }

    // -------------------------------------------------------------------------
    // Thread listing
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    @DisplayName("GET /api/forum/threads → 200 with paged response fields")
    void getThreads_noParams_returns200WithPagedResponse() {
        given()
            .port(port)
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .body("threads", notNullValue())
            .body("page", equalTo(0))
            .body("hasMore", notNullValue());
    }

    // -------------------------------------------------------------------------
    // Create thread — happy path
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    @DisplayName("POST /api/forum/threads → 201 with valid request and auth")
    void createThread_validRequest_returns201() {
        CreateThreadRequest request = new CreateThreadRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("title", equalTo("Test Thread Title"))
            .body("authorUsername", equalTo(USER));
    }

    // -------------------------------------------------------------------------
    // Create thread — boundary tests (CONSTRAINT: title max 200)
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    @DisplayName("POST /api/forum/threads → 400 when title is 201 chars (exceeds max 200)")
    void createThread_titleTooLong_returns400() {
        // BOUNDARY TEST: title max 200 chars
        String title201 = "A".repeat(201);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .title(title201)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/forum/threads → 201 when title is exactly 200 chars (at boundary)")
    void createThread_titleExactlyMaxLength_returns201() {
        // BOUNDARY TEST: title at max boundary
        String title200 = "B".repeat(200);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .title(title200)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .body("title", equalTo(title200));
    }

    // -------------------------------------------------------------------------
    // Create thread — boundary tests (CONSTRAINT: description max 5000)
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    @DisplayName("POST /api/forum/threads → 400 when description is 5001 chars (exceeds max 5000)")
    void createThread_descriptionTooLong_returns400() {
        // BOUNDARY TEST: description max 5000 chars
        String desc5001 = "D".repeat(5001);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .description(desc5001)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(7)
    @DisplayName("POST /api/forum/threads → 201 when description is exactly 5000 chars (at boundary)")
    void createThread_descriptionExactlyMaxLength_returns201() {
        // BOUNDARY TEST: description at max boundary
        String desc5000 = "E".repeat(5000);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .description(desc5000)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201);
    }

    // -------------------------------------------------------------------------
    // Create thread — auth / validation
    // -------------------------------------------------------------------------

    @Test
    @Order(8)
    @DisplayName("POST /api/forum/threads → 401 when unauthenticated")
    void createThread_unauthenticated_returns401() {
        CreateThreadRequest request = new CreateThreadRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(401);
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/forum/threads → 400 when title is blank")
    void createThread_blankTitle_returns400() {
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .title("")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(400);
    }

    // -------------------------------------------------------------------------
    // Create reply — happy path
    // -------------------------------------------------------------------------

    @Test
    @Order(10)
    @DisplayName("POST /api/forum/threads/{id}/replies → 201 with valid request")
    void createReply_validRequest_returns201() {
        // Create thread first
        Long threadId = createThreadAndGetId();

        CreateReplyRequest reply = new CreateReplyRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(reply)
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("content", equalTo("Test reply content"))
            .body("depth", equalTo(0));
    }

    // -------------------------------------------------------------------------
    // Create reply — boundary tests (CONSTRAINT: content max 2000)
    // -------------------------------------------------------------------------

    @Test
    @Order(11)
    @DisplayName("POST /api/forum/threads/{id}/replies → 400 when content is 2001 chars (exceeds max 2000)")
    void createReply_contentTooLong_returns400() {
        // BOUNDARY TEST: reply content max 2000 chars
        Long threadId = createThreadAndGetId();
        String content2001 = "R".repeat(2001);
        CreateReplyRequest reply = new CreateReplyRequestBuilder()
                .content(content2001)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(reply)
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(12)
    @DisplayName("POST /api/forum/threads/{id}/replies → 201 when content is exactly 2000 chars (at boundary)")
    void createReply_contentExactlyMaxLength_returns201() {
        // BOUNDARY TEST: reply content at max boundary
        Long threadId = createThreadAndGetId();
        String content2000 = "S".repeat(2000);
        CreateReplyRequest reply = new CreateReplyRequestBuilder()
                .content(content2000)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(reply)
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201);
    }

    // -------------------------------------------------------------------------
    // Nested reply depth tests (CONSTRAINT: max 3 levels deep = depth 0,1,2)
    // -------------------------------------------------------------------------

    @Test
    @Order(13)
    @DisplayName("Nested reply at depth 2 (3rd level) → 201 — at max depth boundary")
    void createNestedReply_atMaxDepth_returns201() {
        // BOUNDARY TEST: depth 0 → depth 1 → depth 2 (last allowed level)
        Long threadId = createThreadAndGetId();

        // depth 0 (direct reply to thread)
        Long replyId0 = createReplyOnThread(threadId, "Level 0 reply");

        // depth 1 (reply on depth-0 reply)
        Long replyId1 = createNestedReplyOnReply(replyId0, "Level 1 reply");

        // depth 2 (reply on depth-1 reply) — should succeed (3 levels = 0,1,2)
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder().content("Level 2 reply").parentReplyId(replyId1).build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .body("depth", equalTo(2));
    }

    @Test
    @Order(14)
    @DisplayName("Nested reply at depth 3 (4th level) → 400 — exceeds max depth")
    void createNestedReply_exceedsMaxDepth_returns400() {
        // BOUNDARY TEST: depth 3 exceeds max of 3 levels (0-indexed 0,1,2)
        Long threadId = createThreadAndGetId();

        Long replyId0 = createReplyOnThread(threadId, "Level 0");
        Long replyId1 = createNestedReplyOnReply(replyId0, "Level 1");
        Long replyId2 = createNestedReplyOnReply(replyId1, "Level 2");

        // depth 3 — should be rejected
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder().content("Level 3 reply — too deep").parentReplyId(replyId2).build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(400);
    }

    // -------------------------------------------------------------------------
    // Get thread by ID
    // -------------------------------------------------------------------------

    @Test
    @Order(15)
    @DisplayName("GET /api/forum/threads/{id} → 200 with thread and replies")
    void getThread_byId_returns200WithReplies() {
        Long threadId = createThreadAndGetId();
        createReplyOnThread(threadId, "A reply for the detail test");

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("id", equalTo(threadId.intValue()))
            .body("title", notNullValue())
            .body("replies", notNullValue());
    }

    @Test
    @Order(16)
    @DisplayName("GET /api/forum/threads/99999 → 404 when thread not found")
    void getThread_notFound_returns404() {
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/99999")
        .then()
            .statusCode(404);
    }

    // -------------------------------------------------------------------------
    // Voting
    // -------------------------------------------------------------------------

    @Test
    @Order(17)
    @DisplayName("POST /api/forum/posts/{id}/vote → 200 with newScore=1 after upvote")
    void vote_upvote_returns200WithNewScore() {
        Long threadId = createThreadAndGetId();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .body("postId", equalTo(threadId.intValue()))
            .body("postType", equalTo("thread"))
            .body("newScore", equalTo(1))
            .body("userVote", equalTo(1));
    }

    @Test
    @Order(18)
    @DisplayName("POST /api/forum/posts/{id}/vote → upserts on duplicate vote")
    void vote_duplicateVote_updatesScore() {
        Long threadId = createThreadAndGetId();

        // First vote: upvote (+1)
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .body("newScore", equalTo(1));

        // Second vote: change to downvote (-1), score should change from 1 → -1
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "thread")
            .body(new VoteRequest(-1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .body("newScore", equalTo(-1))
            .body("userVote", equalTo(-1));
    }

    // -------------------------------------------------------------------------
    // Delete thread
    // -------------------------------------------------------------------------

    @Test
    @Order(19)
    @DisplayName("DELETE /api/forum/threads/{id} → 204 when deleting own thread")
    void deleteThread_ownThread_returns204() {
        Long threadId = createThreadAndGetId();

        given()
            .port(port)
            .auth().preemptive().basic(USER, PASSWORD)
        .when()
            .delete("/api/forum/threads/" + threadId)
        .then()
            .statusCode(204);
    }

    @Test
    @Order(20)
    @DisplayName("DELETE /api/forum/threads/{id} → 403 when deleting another user's thread")
    void deleteThread_otherUsersThread_returns403() {
        // Create thread as default user
        Long threadId = createThreadAndGetId();

        // Register a different user
        String otherUser = "otheruser_" + System.currentTimeMillis();
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new RegisterRequestBuilder()
                    .email(otherUser + "@example.com")
                    .username(otherUser)
                    .password("password123")
                    .build())
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200);

        // Try to delete the default user's thread as other user
        given()
            .port(port)
            .auth().preemptive().basic(otherUser, "password123")
        .when()
            .delete("/api/forum/threads/" + threadId)
        .then()
            .statusCode(403);
    }

    // -------------------------------------------------------------------------
    // End-to-end flow test
    // -------------------------------------------------------------------------

    @Test
    @Order(21)
    @DisplayName("Forum flow: create thread → reply → upvote → verify score via GET")
    void forumFlow_createThreadAndReply_scoreUpdates() {
        // 1. Create thread
        Long threadId = createThreadAndGetId();

        // 2. Add reply
        createReplyOnThread(threadId, "Flow test reply");

        // 3. Upvote thread
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .body("newScore", equalTo(1));

        // 4. Verify score via GET
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("score", equalTo(1))
            .body("replies", hasSize(1));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Long createThreadAndGetId() {
        Integer id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateThreadRequestBuilder().build())
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .extract()
            .path("id");
        return id.longValue();
    }

    private Long createReplyOnThread(Long threadId, String content) {
        Integer id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder().content(content).build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .extract()
            .path("id");
        return id.longValue();
    }

    private Long createNestedReplyOnReply(Long parentReplyId, String content) {
        Integer id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder().content(content).parentReplyId(parentReplyId).build())
        .when()
            .post("/api/forum/replies/" + parentReplyId + "/replies")
        .then()
            .statusCode(201)
            .extract()
            .path("id");
        return id.longValue();
    }
}
