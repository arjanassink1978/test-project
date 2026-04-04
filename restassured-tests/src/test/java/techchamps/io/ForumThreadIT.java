package techchamps.io;

import techchamps.io.builder.CreateReplyRequestBuilder;
import techchamps.io.builder.CreateThreadRequestBuilder;
import techchamps.io.builder.RegisterRequestBuilder;
import techchamps.io.dto.request.CreateReplyRequest;
import techchamps.io.dto.request.CreateThreadRequest;
import techchamps.io.dto.request.VoteRequest;
import techchamps.io.dto.response.ForumCategoryResponse;
import techchamps.io.dto.response.ForumReplyResponse;
import techchamps.io.dto.response.ForumThreadResponse;
import techchamps.io.dto.response.ForumThreadDetailResponse;
import techchamps.io.dto.response.PagedThreadsResponse;
import techchamps.io.dto.response.VoteResponse;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import java.util.Arrays;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Forum endpoints.
 *
 * All tests extend BaseIntegrationTest (provides @SpringBootTest + @LocalServerPort).
 * Authenticated requests use JWT Bearer tokens obtained via the login endpoint.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Forum API Integration Tests")
class ForumThreadIT extends BaseIntegrationTest {

    // -------------------------------------------------------------------------
    // Categories
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("GET /api/forum/categories → 200 with at least 1 category")
    void getCategories_returns200AndList() {
        List<ForumCategoryResponse> categories = Arrays.asList(given()
            .port(port)
        .when()
            .get("/api/forum/categories")
        .then()
            .statusCode(200)
            .extract().as(ForumCategoryResponse[].class));

        assertThat(categories).hasSizeGreaterThanOrEqualTo(1);
        assertThat(categories.get(0).getId()).isNotNull();
        assertThat(categories.get(0).getName()).isNotNull();
    }

    // -------------------------------------------------------------------------
    // Thread listing
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    @DisplayName("GET /api/forum/threads → 200 with paged response fields")
    void getThreads_noParams_returns200WithPagedResponse() {
        PagedThreadsResponse response = given()
            .port(port)
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .extract().as(PagedThreadsResponse.class);

        assertThat(response.getThreads()).isNotNull();
        assertThat(response.getPage()).isEqualTo(0);
        assertThat(response.isHasMore()).isNotNull();
    }

    // -------------------------------------------------------------------------
    // Create thread — happy path
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    @DisplayName("POST /api/forum/threads → 201 with valid request and auth")
    void createThread_validRequest_returns201() {
        String token = userToken();
        CreateThreadRequest request = new CreateThreadRequestBuilder().build();

        ForumThreadResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .extract().as(ForumThreadResponse.class);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Test Thread Title");
        assertThat(response.getAuthorUsername()).isEqualTo("user");
    }

    // -------------------------------------------------------------------------
    // Create thread — boundary tests (CONSTRAINT: title max 200)
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    @DisplayName("POST /api/forum/threads → 400 when title is 201 chars (exceeds max 200)")
    void createThread_titleTooLong_returns400() {
        String token = userToken();
        String title201 = "A".repeat(201);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .title(title201)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
        String token = userToken();
        String title200 = "B".repeat(200);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .title(title200)
                .build();

        ForumThreadResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .extract().as(ForumThreadResponse.class);

        assertThat(response.getTitle()).isEqualTo(title200);
    }

    // -------------------------------------------------------------------------
    // Create thread — boundary tests (CONSTRAINT: description max 5000)
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    @DisplayName("POST /api/forum/threads → 400 when description is 5001 chars (exceeds max 5000)")
    void createThread_descriptionTooLong_returns400() {
        String token = userToken();
        String desc5001 = "D".repeat(5001);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .description(desc5001)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
        String token = userToken();
        String desc5000 = "E".repeat(5000);
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .description(desc5000)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
        String token = userToken();
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .title("")
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
        Long threadId = createThreadAndGetId();
        String token = userToken();

        CreateReplyRequest reply = new CreateReplyRequestBuilder().build();

        ForumReplyResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .body(reply)
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .extract().as(ForumReplyResponse.class);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getContent()).isEqualTo("Test reply content");
        assertThat(response.getDepth()).isEqualTo(0);
    }

    // -------------------------------------------------------------------------
    // Create reply — boundary tests (CONSTRAINT: content max 2000)
    // -------------------------------------------------------------------------

    @Test
    @Order(11)
    @DisplayName("POST /api/forum/threads/{id}/replies → 400 when content is 2001 chars (exceeds max 2000)")
    void createReply_contentTooLong_returns400() {
        Long threadId = createThreadAndGetId();
        String token = userToken();
        String content2001 = "R".repeat(2001);
        CreateReplyRequest reply = new CreateReplyRequestBuilder()
                .content(content2001)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
        Long threadId = createThreadAndGetId();
        String token = userToken();
        String content2000 = "S".repeat(2000);
        CreateReplyRequest reply = new CreateReplyRequestBuilder()
                .content(content2000)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
        Long threadId = createThreadAndGetId();
        String token = userToken();

        Long replyId0 = createReplyOnThread(threadId, "Level 0 reply", token);
        Long replyId1 = createNestedReplyOnReply(replyId0, "Level 1 reply", token);

        ForumReplyResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .body(new CreateReplyRequestBuilder().content("Level 2 reply").parentReplyId(replyId1).build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .extract().as(ForumReplyResponse.class);

        assertThat(response.getDepth()).isEqualTo(2);
    }

    @Test
    @Order(14)
    @DisplayName("Nested reply at depth 3 (4th level) → 400 — exceeds max depth")
    void createNestedReply_exceedsMaxDepth_returns400() {
        Long threadId = createThreadAndGetId();
        String token = userToken();

        Long replyId0 = createReplyOnThread(threadId, "Level 0", token);
        Long replyId1 = createNestedReplyOnReply(replyId0, "Level 1", token);
        Long replyId2 = createNestedReplyOnReply(replyId1, "Level 2", token);

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
        String token = userToken();
        createReplyOnThread(threadId, "A reply for the detail test", token);

        ForumThreadDetailResponse response = given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .extract().as(ForumThreadDetailResponse.class);

        assertThat(response.getId()).isEqualTo(threadId);
        assertThat(response.getTitle()).isNotNull();
        assertThat(response.getReplies()).isNotNull();
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
        String token = userToken();

        VoteResponse response = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(response.getPostId()).isEqualTo(threadId);
        assertThat(response.getPostType()).isEqualTo("thread");
        assertThat(response.getNewScore()).isEqualTo(1);
        assertThat(response.getUserVote()).isEqualTo(1);
    }

    @Test
    @Order(18)
    @DisplayName("POST /api/forum/posts/{id}/vote → direct switch upvote→downvote sends -1, score goes 1→-1")
    void vote_directSwitchUpvoteToDownvote_scoreChanges() {
        Long threadId = createThreadAndGetId();
        String token = userToken();

        VoteResponse firstVote = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(firstVote.getNewScore()).isEqualTo(1);

        VoteResponse secondVote = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(-1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(secondVote.getNewScore()).isEqualTo(-1);
        assertThat(secondVote.getUserVote()).isEqualTo(-1);
    }

    // -------------------------------------------------------------------------
    // Delete thread
    // -------------------------------------------------------------------------

    @Test
    @Order(19)
    @DisplayName("DELETE /api/forum/threads/{id} → 204 when deleting own thread")
    void deleteThread_ownThread_returns204() {
        Long threadId = createThreadAndGetId();
        String token = userToken();

        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .delete("/api/forum/threads/" + threadId)
        .then()
            .statusCode(204);
    }

    @Test
    @Order(20)
    @DisplayName("DELETE /api/forum/threads/{id} → 403 when deleting another user's thread")
    void deleteThread_otherUsersThread_returns403() {
        Long threadId = createThreadAndGetId();

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

        String otherToken = fetchToken(otherUser, "password123");

        given()
            .port(port)
            .header("Authorization", "Bearer " + otherToken)
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
        Long threadId = createThreadAndGetId();
        String token = userToken();

        createReplyOnThread(threadId, "Flow test reply", token);

        VoteResponse voteResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(voteResponse.getNewScore()).isEqualTo(1);

        ForumThreadDetailResponse threadDetail = given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .extract().as(ForumThreadDetailResponse.class);

        assertThat(threadDetail.getScore()).isEqualTo(1);
        assertThat(threadDetail.getReplies()).hasSize(1);
    }

    // -------------------------------------------------------------------------
    // Cancel vote (voteValue=0) — issue #44
    // -------------------------------------------------------------------------

    @Test
    @Order(22)
    @DisplayName("POST /api/forum/posts/{id}/vote → cancel upvote by sending 0, score returns to 0")
    void vote_cancelExistingUpvote_sendZero_returns200WithScoreZero() {
        Long threadId = createThreadAndGetId();
        String token = userToken();

        // Upvote: score 0 → 1
        VoteResponse upvoteResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(upvoteResponse.getNewScore()).isEqualTo(1);
        assertThat(upvoteResponse.getUserVote()).isEqualTo(1);

        // Cancel: send 0, score 1 → 0
        VoteResponse cancelResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(0))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(cancelResponse.getNewScore()).isEqualTo(0);
        assertThat(cancelResponse.getUserVote()).isEqualTo(0);

        // Verify persisted via GET
        ForumThreadDetailResponse thread = given()
            .port(port)
        .when()
            .get("/api/forum/threads/{id}", threadId)
        .then()
            .statusCode(200)
            .extract().as(ForumThreadDetailResponse.class);

        assertThat(thread.getScore()).isEqualTo(0);
    }

    @Test
    @Order(23)
    @DisplayName("POST /api/forum/posts/{id}/vote → cancel downvote by sending 0, score returns to 0")
    void vote_cancelExistingDownvote_sendZero_returns200WithScoreZero() {
        Long threadId = createThreadAndGetId();
        String token = userToken();

        // Downvote: score 0 → -1
        VoteResponse downvoteResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(-1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(downvoteResponse.getNewScore()).isEqualTo(-1);
        assertThat(downvoteResponse.getUserVote()).isEqualTo(-1);

        // Cancel: send 0, score -1 → 0
        VoteResponse cancelResponse = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .queryParam("postType", "thread")
            .body(new VoteRequest(0))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(200)
            .extract().as(VoteResponse.class);

        assertThat(cancelResponse.getNewScore()).isEqualTo(0);
        assertThat(cancelResponse.getUserVote()).isEqualTo(0);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Long createThreadAndGetId() {
        String token = userToken();
        Integer id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .body(new CreateThreadRequestBuilder().build())
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .extract()
            .path("id");
        return id.longValue();
    }

    private Long createReplyOnThread(Long threadId, String content, String token) {
        Integer id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
            .body(new CreateReplyRequestBuilder().content(content).build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .extract()
            .path("id");
        return id.longValue();
    }

    private Long createNestedReplyOnReply(Long parentReplyId, String content, String token) {
        Integer id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + token)
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
