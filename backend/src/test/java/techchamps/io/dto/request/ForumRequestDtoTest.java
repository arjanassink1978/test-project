package techchamps.io.dto.request;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ForumRequestDtoTest {

    // ============================================================
    // CreateThreadRequest
    // ============================================================

    @Test
    void createThreadRequest_constructorSetsAllFields() {
        CreateThreadRequest req = new CreateThreadRequest("Title", "Description", 5L);

        assertThat(req.getTitle()).isEqualTo("Title");
        assertThat(req.getDescription()).isEqualTo("Description");
        assertThat(req.getCategoryId()).isEqualTo(5L);
    }

    @Test
    void createThreadRequest_defaultConstructor_fieldsAreNull() {
        CreateThreadRequest req = new CreateThreadRequest();

        assertThat(req.getTitle()).isNull();
        assertThat(req.getDescription()).isNull();
        assertThat(req.getCategoryId()).isNull();
    }

    @Test
    void createThreadRequest_settersOverrideValues() {
        CreateThreadRequest req = new CreateThreadRequest("Original", "Orig desc", 1L);
        req.setTitle("Updated");
        req.setDescription("Updated desc");
        req.setCategoryId(2L);

        assertThat(req.getTitle()).isEqualTo("Updated");
        assertThat(req.getDescription()).isEqualTo("Updated desc");
        assertThat(req.getCategoryId()).isEqualTo(2L);
    }

    @Test
    void createThreadRequest_nullCategoryId() {
        CreateThreadRequest req = new CreateThreadRequest("Title", "Desc", null);

        assertThat(req.getCategoryId()).isNull();
    }

    // ============================================================
    // CreateReplyRequest
    // ============================================================

    @Test
    void createReplyRequest_constructorSetsAllFields() {
        CreateReplyRequest req = new CreateReplyRequest("Reply content", 10L);

        assertThat(req.getContent()).isEqualTo("Reply content");
        assertThat(req.getParentReplyId()).isEqualTo(10L);
    }

    @Test
    void createReplyRequest_defaultConstructor_fieldsAreNull() {
        CreateReplyRequest req = new CreateReplyRequest();

        assertThat(req.getContent()).isNull();
        assertThat(req.getParentReplyId()).isNull();
    }

    @Test
    void createReplyRequest_settersOverrideValues() {
        CreateReplyRequest req = new CreateReplyRequest("Original", 1L);
        req.setContent("Updated");
        req.setParentReplyId(2L);

        assertThat(req.getContent()).isEqualTo("Updated");
        assertThat(req.getParentReplyId()).isEqualTo(2L);
    }

    @Test
    void createReplyRequest_nullParentReplyId_isDirectReply() {
        CreateReplyRequest req = new CreateReplyRequest("Content", null);

        assertThat(req.getParentReplyId()).isNull();
    }

    // ============================================================
    // VoteRequest
    // ============================================================

    @Test
    void voteRequest_constructorSetsValue() {
        VoteRequest req = new VoteRequest(1);
        assertThat(req.getVoteValue()).isEqualTo(1);
    }

    @Test
    void voteRequest_defaultConstructor_valueIsZero() {
        VoteRequest req = new VoteRequest();
        assertThat(req.getVoteValue()).isEqualTo(0);
    }

    @Test
    void voteRequest_setterOverridesValue() {
        VoteRequest req = new VoteRequest(1);
        req.setVoteValue(-1);
        assertThat(req.getVoteValue()).isEqualTo(-1);
    }

    @Test
    void voteRequest_downvoteValue() {
        VoteRequest req = new VoteRequest(-1);
        assertThat(req.getVoteValue()).isEqualTo(-1);
    }

    @Test
    void voteRequest_removeVoteValue() {
        VoteRequest req = new VoteRequest(0);
        assertThat(req.getVoteValue()).isEqualTo(0);
    }
}
