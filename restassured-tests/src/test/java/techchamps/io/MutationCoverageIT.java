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
 * Integration tests targeting surviving PIT mutations.
 *
 * Coverage goals:
 * - ForumService.buildReplyTree() — nested tree structure, empty replies
 * - NullReturnValsMutator — user/thread/category not found → 404 (not silent)
 * - EmptyObjectReturnValsMutator — empty collections at boundaries
 * - PrimitiveReturnsMutator — score/count exact values at 0 and after mutations
 * - VoidMethodCallMutator — verify save-related side-effects are observable
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Mutation Coverage Tests — boundary, null-handling, empty collections, score precision")
class MutationCoverageIT extends BaseIntegrationTest {

    private static final String USER = "user";
    private static final String PASSWORD = "user1234";

    // -------------------------------------------------------------------------
    // Priority 1a: ForumService.buildReplyTree() — tree structure
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("GET thread with no replies → replies is empty list, not null")
    void getThread_noReplies_repliesIsEmptyList() {
        Long threadId = createThreadAndGetId();

        // CONSTRAINT: EmptyObjectReturnValsMutator — must be [] not null
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("id", equalTo(threadId.intValue()))
            .body("replies", notNullValue())
            .body("replies", hasSize(0));
    }

    @Test
    @Order(2)
    @DisplayName("GET thread with one top-level reply → replies has size 1, nested replies empty list")
    void getThread_oneReply_repliesHasOneMember() {
        Long threadId = createThreadAndGetId();
        createReplyOnThread(threadId, "Single top-level reply");

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("replies", hasSize(1))
            .body("replies[0].content", equalTo("Single top-level reply"))
            .body("replies[0].depth", equalTo(0))
            .body("replies[0].parentReplyId", nullValue())
            // CONSTRAINT: EmptyObjectReturnValsMutator — child replies must be [] not null
            .body("replies[0].replies", hasSize(0));
    }

    @Test
    @Order(3)
    @DisplayName("buildReplyTree: depth-1 reply appears as child of depth-0 reply in GET response")
    void getThread_nestedReplies_treeStructureIsCorrect() {
        Long threadId = createThreadAndGetId();

        // depth 0
        Long replyId0 = createReplyOnThread(threadId, "Root reply");

        // depth 1 — child of replyId0
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder()
                    .content("Child reply depth 1")
                    .parentReplyId(replyId0)
                    .build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .body("depth", equalTo(1))
            .body("parentReplyId", equalTo(replyId0.intValue()));

        // GET thread and verify tree: replies[0] has one child
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("replies", hasSize(1))
            .body("replies[0].depth", equalTo(0))
            .body("replies[0].replies", hasSize(1))
            .body("replies[0].replies[0].content", equalTo("Child reply depth 1"))
            .body("replies[0].replies[0].depth", equalTo(1));
    }

    @Test
    @Order(4)
    @DisplayName("buildReplyTree: three-level nesting (depth 0→1→2) is fully returned in GET")
    void getThread_threeLevel_treeFullyRepresented() {
        Long threadId = createThreadAndGetId();

        // depth 0
        Long d0id = createReplyOnThread(threadId, "Depth 0");

        // depth 1
        Long d1id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder()
                    .content("Depth 1")
                    .parentReplyId(d0id)
                    .build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .extract().<Integer>path("id").longValue();

        // depth 2
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder()
                    .content("Depth 2")
                    .parentReplyId(d1id)
                    .build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .body("depth", equalTo(2));

        // GET and verify three-level tree is built
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("replies", hasSize(1))
            .body("replies[0].depth", equalTo(0))
            .body("replies[0].replies", hasSize(1))
            .body("replies[0].replies[0].depth", equalTo(1))
            .body("replies[0].replies[0].replies", hasSize(1))
            .body("replies[0].replies[0].replies[0].depth", equalTo(2))
            .body("replies[0].replies[0].replies[0].content", equalTo("Depth 2"));
    }

    @Test
    @Order(5)
    @DisplayName("buildReplyTree: replies at max depth (2) have no children in tree (empty list)")
    void getThread_atMaxDepth_leafNodeHasEmptyReplies() {
        Long threadId = createThreadAndGetId();

        Long d0id = createReplyOnThread(threadId, "D0");
        Long d1id = given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder().content("D1").parentReplyId(d0id).build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .extract().<Integer>path("id").longValue();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder().content("D2 leaf").parentReplyId(d1id).build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201);

        // CONSTRAINT: buildReplyTree stops at MAX_REPLY_DEPTH-1 = depth 2
        // leaf at depth 2 should have empty child list in response
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("replies[0].replies[0].replies[0].replies", hasSize(0));
    }

    // -------------------------------------------------------------------------
    // Priority 1b: Repository null handling → 404 (NullReturnValsMutator)
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    @DisplayName("GET /api/forum/threads/999999 → 404 not silent failure")
    void getThread_nonExistentId_returns404NotSilent() {
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/999999")
        .then()
            .statusCode(404);
    }

    @Test
    @Order(7)
    @DisplayName("POST /api/forum/threads with non-existent categoryId → 404")
    void createThread_nonExistentCategory_returns404() {
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .categoryId(999999L)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(404);
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/forum/threads/{id}/replies → 404 when thread does not exist")
    void createReply_nonExistentThread_returns404() {
        CreateReplyRequest reply = new CreateReplyRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(reply)
        .when()
            .post("/api/forum/threads/999999/replies")
        .then()
            .statusCode(404);
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/forum/posts/999999/vote with postType=thread → 404 when thread not found")
    void vote_nonExistentThread_returns404() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "thread")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/999999/vote")
        .then()
            .statusCode(404);
    }

    @Test
    @Order(10)
    @DisplayName("POST /api/forum/posts/999999/vote with postType=reply → 404 when reply not found")
    void vote_nonExistentReply_returns404() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "reply")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/999999/vote")
        .then()
            .statusCode(404);
    }

    @Test
    @Order(11)
    @DisplayName("DELETE /api/forum/threads/999999 → 404 when thread not found")
    void deleteThread_nonExistentThread_returns404() {
        given()
            .port(port)
            .auth().preemptive().basic(USER, PASSWORD)
        .when()
            .delete("/api/forum/threads/999999")
        .then()
            .statusCode(404);
    }

    @Test
    @Order(12)
    @DisplayName("GET /api/profile/nonexistent_xyz → 404 not null/empty")
    void getProfile_nonExistentUser_returns404NotEmpty() {
        given()
            .port(port)
        .when()
            .get("/api/profile/{username}", "nonexistent_xyz_12345")
        .then()
            .statusCode(404);
    }

    // -------------------------------------------------------------------------
    // Priority 2a: EmptyObjectReturnValsMutator — boundary between empty and not-found
    // -------------------------------------------------------------------------

    @Test
    @Order(13)
    @DisplayName("GET /api/forum/threads → threads list is empty list, not null, when no threads created")
    void getThreads_filterByUnusedCategory_returnsEmptyThreadsList() {
        // Use a category filter that likely has no threads — verifies [] not null
        given()
            .port(port)
            .queryParam("category", "999")
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .body("threads", notNullValue())
            .body("threads", hasSize(0))
            .body("hasMore", equalTo(false));
    }

    @Test
    @Order(14)
    @DisplayName("GET thread → replyCount is 0 for thread with no replies (not null or negative)")
    void getThread_noReplies_replyCountIsExactlyZero() {
        Long threadId = createThreadAndGetId();

        // CONSTRAINT: PrimitiveReturnsMutator — replyCount must be exactly 0
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("replyCount", equalTo(0));
    }

    @Test
    @Order(15)
    @DisplayName("GET thread → replyCount increments to exact value after adding replies")
    void getThread_withReplies_replyCountIsExact() {
        Long threadId = createThreadAndGetId();
        createReplyOnThread(threadId, "First reply");
        createReplyOnThread(threadId, "Second reply");

        // CONSTRAINT: PrimitiveReturnsMutator — exact count, not just non-null
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("replyCount", equalTo(2));
    }

    // -------------------------------------------------------------------------
    // Priority 2b: PrimitiveReturnsMutator — score exact values at boundaries
    // -------------------------------------------------------------------------

    @Test
    @Order(16)
    @DisplayName("New thread score is exactly 0 (not null, not negative)")
    void createThread_initialScore_isExactlyZero() {
        // CONSTRAINT: PrimitiveReturnsMutator — score starts at 0
        Long threadId = createThreadAndGetId();

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("score", equalTo(0));
    }

    @Test
    @Order(17)
    @DisplayName("New reply score is exactly 0 (not null, not negative)")
    void createReply_initialScore_isExactlyZero() {
        Long threadId = createThreadAndGetId();

        // CONSTRAINT: PrimitiveReturnsMutator — reply score starts at 0
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateReplyRequestBuilder().content("Score zero reply").build())
        .when()
            .post("/api/forum/threads/" + threadId + "/replies")
        .then()
            .statusCode(201)
            .body("score", equalTo(0));
    }

    @Test
    @Order(18)
    @DisplayName("Upvote thread: score goes from 0 to exactly 1")
    void vote_upvoteThread_scoreGoesFromZeroToOne() {
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
            .body("newScore", equalTo(1))
            .body("userVote", equalTo(1));

        // Verify the score is persisted via GET
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("score", equalTo(1));
    }

    @Test
    @Order(19)
    @DisplayName("Downvote thread: score goes from 0 to exactly -1")
    void vote_downvoteThread_scoreGoesFromZeroToNegativeOne() {
        Long threadId = createThreadAndGetId();

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

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("score", equalTo(-1));
    }

    @Test
    @Order(20)
    @DisplayName("Upvote then switch to downvote: score ends at exactly -1, not 0 or -2")
    void vote_changeFromUpvoteToDownvote_scoreIsExactlyMinusOne() {
        Long threadId = createThreadAndGetId();

        // First: upvote → score = 1
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

        // Second: change to downvote → score = -1 (not 0 or -2)
        // CONSTRAINT: PrimitiveReturnsMutator — score = prev - oldVote + newVote = 1 - 1 + (-1) = -1
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
            .body("newScore", equalTo(-1));

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("score", equalTo(-1));
    }

    @Test
    @Order(21)
    @DisplayName("Vote on reply: reply score updated exactly, not thread score")
    void vote_upvoteReply_replyScoreIsExactlyOne() {
        Long threadId = createThreadAndGetId();
        Long replyId = createReplyOnThread(threadId, "Reply to vote on");

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "reply")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + replyId + "/vote")
        .then()
            .statusCode(200)
            .body("postType", equalTo("reply"))
            .body("newScore", equalTo(1))
            .body("userVote", equalTo(1));

        // Thread score should remain 0 — reply vote doesn't affect thread
        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("score", equalTo(0));
    }

    // -------------------------------------------------------------------------
    // Priority 2c: VoidMethodCallMutator — verify saves are observable
    // -------------------------------------------------------------------------

    @Test
    @Order(22)
    @DisplayName("Thread save is observable: created thread is retrievable via GET")
    void createThread_save_isPersisted() {
        // CONSTRAINT: VoidMethodCallMutator — if threadRepository.save() is removed, GET returns 404
        Long threadId = createThreadAndGetId();

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("id", equalTo(threadId.intValue()));
    }

    @Test
    @Order(23)
    @DisplayName("Reply save is observable: created reply appears in thread's replies list")
    void createReply_save_isPersisted() {
        // CONSTRAINT: VoidMethodCallMutator — if replyRepository.save() is removed, reply absent
        Long threadId = createThreadAndGetId();
        createReplyOnThread(threadId, "Persisted reply");

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("replies", hasSize(1))
            .body("replies[0].content", equalTo("Persisted reply"));
    }

    @Test
    @Order(24)
    @DisplayName("Vote save is observable: second GET reflects updated score")
    void vote_save_isPersisted() {
        // CONSTRAINT: VoidMethodCallMutator — if voteRepository.save() is removed, score won't update
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
            .statusCode(200);

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("score", equalTo(1));
    }

    // -------------------------------------------------------------------------
    // Priority 2d: Invalid postType → 400 (covers else branch in vote)
    // -------------------------------------------------------------------------

    @Test
    @Order(25)
    @DisplayName("POST /api/forum/posts/{id}/vote with invalid postType → 400")
    void vote_invalidPostType_returns400() {
        Long threadId = createThreadAndGetId();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .queryParam("postType", "invalid_type")
            .body(new VoteRequest(1))
        .when()
            .post("/api/forum/posts/" + threadId + "/vote")
        .then()
            .statusCode(400);
    }

    // -------------------------------------------------------------------------
    // Priority 2e: Thread search — empty result when no match
    // -------------------------------------------------------------------------

    @Test
    @Order(26)
    @DisplayName("GET /api/forum/threads?search=zzznomatch → empty threads list")
    void getThreads_searchWithNoMatch_returnsEmptyList() {
        given()
            .port(port)
            .queryParam("search", "zzznomatch_xyz_99999")
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .body("threads", hasSize(0))
            .body("hasMore", equalTo(false));
    }

    @Test
    @Order(27)
    @DisplayName("GET /api/forum/threads?search=<term> → returns matching thread")
    void getThreads_searchWithMatch_returnsNonEmptyList() {
        String uniqueTitle = "UniqueTitleXyz_" + System.currentTimeMillis();
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .title(uniqueTitle)
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

        given()
            .port(port)
            .queryParam("search", uniqueTitle)
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .body("threads", hasSize(greaterThanOrEqualTo(1)))
            .body("threads[0].title", equalTo(uniqueTitle));
    }

    @Test
    @Order(28)
    @DisplayName("GET /api/forum/threads?sort=popular → 200 with paged response")
    void getThreads_sortPopular_returns200() {
        given()
            .port(port)
            .queryParam("sort", "popular")
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .body("threads", notNullValue())
            .body("page", equalTo(0));
    }

    @Test
    @Order(29)
    @DisplayName("GET /api/forum/threads?sort=newest → page and hasMore fields are correct types")
    void getThreads_sortNewest_pageFieldIsZero() {
        given()
            .port(port)
            .queryParam("sort", "newest")
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .body("page", equalTo(0))
            .body("size", equalTo(20));
    }

    // -------------------------------------------------------------------------
    // Priority 2f: Thread with category — categoryId/categoryName populated
    // -------------------------------------------------------------------------

    @Test
    @Order(30)
    @DisplayName("GET thread created with categoryId → categoryId and categoryName are populated")
    void getThread_withCategory_categoryFieldsNotNull() {
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .categoryId(1L)
                .build();

        Integer threadId = given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .body("categoryId", notNullValue())
            .body("categoryName", notNullValue())
            .extract().<Integer>path("id");

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("categoryId", equalTo(1))
            .body("categoryName", notNullValue());
    }

    @Test
    @Order(31)
    @DisplayName("GET thread created without categoryId → categoryId and categoryName are null")
    void getThread_withoutCategory_categoryFieldsAreNull() {
        CreateThreadRequest request = new CreateThreadRequestBuilder()
                .categoryId(null)
                .build();

        Integer threadId = given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(request)
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201)
            .extract().<Integer>path("id");

        given()
            .port(port)
        .when()
            .get("/api/forum/threads/" + threadId)
        .then()
            .statusCode(200)
            .body("categoryId", nullValue())
            .body("categoryName", nullValue());
    }

    // -------------------------------------------------------------------------
    // Priority 2g: Filter threads by category — boundary between empty and non-empty
    // -------------------------------------------------------------------------

    @Test
    @Order(32)
    @DisplayName("GET /api/forum/threads?category=1 → returns threads in that category")
    void getThreads_byCategory_returnsCorrectThreads() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .auth().preemptive().basic(USER, PASSWORD)
            .body(new CreateThreadRequestBuilder().categoryId(1L).build())
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201);

        given()
            .port(port)
            .queryParam("category", 1)
        .when()
            .get("/api/forum/threads")
        .then()
            .statusCode(200)
            .body("threads", hasSize(greaterThanOrEqualTo(1)))
            .body("threads[0].categoryId", equalTo(1));
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
}
