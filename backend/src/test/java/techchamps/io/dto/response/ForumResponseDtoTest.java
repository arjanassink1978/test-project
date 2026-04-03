package techchamps.io.dto.response;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ForumResponseDtoTest {

    // ============================================================
    // ForumCategoryResponse
    // ============================================================

    @Test
    void forumCategoryResponse_constructorSetsAllFields() {
        ForumCategoryResponse resp = new ForumCategoryResponse(1L, "General", "General discussions", "chat");

        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getName()).isEqualTo("General");
        assertThat(resp.getDescription()).isEqualTo("General discussions");
        assertThat(resp.getIcon()).isEqualTo("chat");
    }

    @Test
    void forumCategoryResponse_defaultConstructor_fieldsAreNull() {
        ForumCategoryResponse resp = new ForumCategoryResponse();

        assertThat(resp.getId()).isNull();
        assertThat(resp.getName()).isNull();
        assertThat(resp.getDescription()).isNull();
        assertThat(resp.getIcon()).isNull();
    }

    @Test
    void forumCategoryResponse_settersOverrideValues() {
        ForumCategoryResponse resp = new ForumCategoryResponse();
        resp.setId(5L);
        resp.setName("Tech");
        resp.setDescription("Technology");
        resp.setIcon("laptop");

        assertThat(resp.getId()).isEqualTo(5L);
        assertThat(resp.getName()).isEqualTo("Tech");
        assertThat(resp.getDescription()).isEqualTo("Technology");
        assertThat(resp.getIcon()).isEqualTo("laptop");
    }

    // ============================================================
    // ForumThreadResponse
    // ============================================================

    @Test
    void forumThreadResponse_settersAndGetters() {
        ForumThreadResponse resp = new ForumThreadResponse();
        LocalDateTime now = LocalDateTime.now();

        resp.setId(1L);
        resp.setTitle("Title");
        resp.setDescription("Description");
        resp.setScore(5);
        resp.setCreatedAt(now);
        resp.setUpdatedAt(now);
        resp.setAuthorUsername("user");
        resp.setCategoryId(2L);
        resp.setCategoryName("Tech");
        resp.setReplyCount(3);

        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getTitle()).isEqualTo("Title");
        assertThat(resp.getDescription()).isEqualTo("Description");
        assertThat(resp.getScore()).isEqualTo(5);
        assertThat(resp.getCreatedAt()).isEqualTo(now);
        assertThat(resp.getUpdatedAt()).isEqualTo(now);
        assertThat(resp.getAuthorUsername()).isEqualTo("user");
        assertThat(resp.getCategoryId()).isEqualTo(2L);
        assertThat(resp.getCategoryName()).isEqualTo("Tech");
        assertThat(resp.getReplyCount()).isEqualTo(3);
    }

    @Test
    void forumThreadResponse_defaultValues() {
        ForumThreadResponse resp = new ForumThreadResponse();

        assertThat(resp.getId()).isNull();
        assertThat(resp.getTitle()).isNull();
        assertThat(resp.getScore()).isEqualTo(0);
        assertThat(resp.getReplyCount()).isEqualTo(0);
    }

    // ============================================================
    // ForumThreadDetailResponse
    // ============================================================

    @Test
    void forumThreadDetailResponse_setAndGetReplies() {
        ForumThreadDetailResponse resp = new ForumThreadDetailResponse();

        ForumReplyResponse reply = new ForumReplyResponse();
        reply.setId(1L);
        reply.setContent("Reply");
        resp.setReplies(List.of(reply));

        assertThat(resp.getReplies()).hasSize(1);
        assertThat(resp.getReplies().get(0).getContent()).isEqualTo("Reply");
    }

    @Test
    void forumThreadDetailResponse_defaultRepliesIsNull() {
        ForumThreadDetailResponse resp = new ForumThreadDetailResponse();
        assertThat(resp.getReplies()).isNull();
    }

    @Test
    void forumThreadDetailResponse_emptyRepliesList() {
        ForumThreadDetailResponse resp = new ForumThreadDetailResponse();
        resp.setReplies(Collections.emptyList());
        assertThat(resp.getReplies()).isEmpty();
    }

    // ============================================================
    // ForumReplyResponse
    // ============================================================

    @Test
    void forumReplyResponse_allFieldsSetAndGet() {
        ForumReplyResponse resp = new ForumReplyResponse();
        LocalDateTime now = LocalDateTime.now();

        resp.setId(10L);
        resp.setContent("Reply content");
        resp.setScore(3);
        resp.setCreatedAt(now);
        resp.setAuthorUsername("replier");
        resp.setDepth(1);
        resp.setParentReplyId(5L);
        resp.setReplies(Collections.emptyList());

        assertThat(resp.getId()).isEqualTo(10L);
        assertThat(resp.getContent()).isEqualTo("Reply content");
        assertThat(resp.getScore()).isEqualTo(3);
        assertThat(resp.getCreatedAt()).isEqualTo(now);
        assertThat(resp.getAuthorUsername()).isEqualTo("replier");
        assertThat(resp.getDepth()).isEqualTo(1);
        assertThat(resp.getParentReplyId()).isEqualTo(5L);
        assertThat(resp.getReplies()).isEmpty();
    }

    @Test
    void forumReplyResponse_defaultValues() {
        ForumReplyResponse resp = new ForumReplyResponse();

        assertThat(resp.getId()).isNull();
        assertThat(resp.getContent()).isNull();
        assertThat(resp.getScore()).isEqualTo(0);
        assertThat(resp.getDepth()).isEqualTo(0);
        assertThat(resp.getParentReplyId()).isNull();
        assertThat(resp.getReplies()).isNull();
    }

    // ============================================================
    // PagedThreadsResponse
    // ============================================================

    @Test
    void pagedThreadsResponse_constructorSetsAllFields() {
        ForumThreadResponse thread = new ForumThreadResponse();
        thread.setId(1L);
        PagedThreadsResponse resp = new PagedThreadsResponse(List.of(thread), 2, 20, true);

        assertThat(resp.getThreads()).hasSize(1);
        assertThat(resp.getThreads().get(0).getId()).isEqualTo(1L);
        assertThat(resp.getPage()).isEqualTo(2);
        assertThat(resp.getSize()).isEqualTo(20);
        assertThat(resp.isHasMore()).isTrue();
    }

    @Test
    void pagedThreadsResponse_defaultConstructor() {
        PagedThreadsResponse resp = new PagedThreadsResponse();

        assertThat(resp.getThreads()).isNull();
        assertThat(resp.getPage()).isEqualTo(0);
        assertThat(resp.getSize()).isEqualTo(0);
        assertThat(resp.isHasMore()).isFalse();
    }

    @Test
    void pagedThreadsResponse_settersOverrideValues() {
        PagedThreadsResponse resp = new PagedThreadsResponse();
        resp.setThreads(Collections.emptyList());
        resp.setPage(5);
        resp.setSize(10);
        resp.setHasMore(true);

        assertThat(resp.getThreads()).isEmpty();
        assertThat(resp.getPage()).isEqualTo(5);
        assertThat(resp.getSize()).isEqualTo(10);
        assertThat(resp.isHasMore()).isTrue();
    }

    @Test
    void pagedThreadsResponse_hasMoreFalse() {
        PagedThreadsResponse resp = new PagedThreadsResponse(Collections.emptyList(), 0, 20, false);
        assertThat(resp.isHasMore()).isFalse();
    }

    // ============================================================
    // VoteResponse
    // ============================================================

    @Test
    void voteResponse_constructorSetsAllFields() {
        VoteResponse resp = new VoteResponse(1L, "thread", 5, 1);

        assertThat(resp.getPostId()).isEqualTo(1L);
        assertThat(resp.getPostType()).isEqualTo("thread");
        assertThat(resp.getNewScore()).isEqualTo(5);
        assertThat(resp.getUserVote()).isEqualTo(1);
    }

    @Test
    void voteResponse_defaultConstructor() {
        VoteResponse resp = new VoteResponse();

        assertThat(resp.getPostId()).isNull();
        assertThat(resp.getPostType()).isNull();
        assertThat(resp.getNewScore()).isEqualTo(0);
        assertThat(resp.getUserVote()).isEqualTo(0);
    }

    @Test
    void voteResponse_settersOverrideValues() {
        VoteResponse resp = new VoteResponse();
        resp.setPostId(10L);
        resp.setPostType("reply");
        resp.setNewScore(-3);
        resp.setUserVote(-1);

        assertThat(resp.getPostId()).isEqualTo(10L);
        assertThat(resp.getPostType()).isEqualTo("reply");
        assertThat(resp.getNewScore()).isEqualTo(-3);
        assertThat(resp.getUserVote()).isEqualTo(-1);
    }

    @Test
    void voteResponse_negativeScore() {
        VoteResponse resp = new VoteResponse(1L, "thread", -10, -1);

        assertThat(resp.getNewScore()).isEqualTo(-10);
        assertThat(resp.getUserVote()).isEqualTo(-1);
    }

    @Test
    void voteResponse_zeroVote() {
        VoteResponse resp = new VoteResponse(1L, "thread", 0, 0);

        assertThat(resp.getNewScore()).isEqualTo(0);
        assertThat(resp.getUserVote()).isEqualTo(0);
    }
}
