package techchamps.io.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ForumVoteTest {

    @Test
    void constructorAndGetters_returnCorrectValues() {
        AppUser voter = new AppUser("voter@test.com", "voter", "pass", Role.USER);
        ForumVote vote = new ForumVote(voter, 42L, "thread", 1);

        assertThat(vote.getVoter()).isSameAs(voter);
        assertThat(vote.getPostId()).isEqualTo(42L);
        assertThat(vote.getPostType()).isEqualTo("thread");
        assertThat(vote.getVoteValue()).isEqualTo(1);
    }

    @Test
    void setId_andGetId_workCorrectly() {
        ForumVote vote = new ForumVote();
        vote.setId(99L);
        assertThat(vote.getId()).isEqualTo(99L);
    }

    @Test
    void setters_overrideConstructorValues() {
        AppUser voter1 = new AppUser("v1@test.com", "v1", "pass", Role.USER);
        AppUser voter2 = new AppUser("v2@test.com", "v2", "pass", Role.USER);
        ForumVote vote = new ForumVote(voter1, 1L, "thread", 1);

        vote.setVoter(voter2);
        vote.setPostId(2L);
        vote.setPostType("reply");
        vote.setVoteValue(-1);

        assertThat(vote.getVoter()).isSameAs(voter2);
        assertThat(vote.getPostId()).isEqualTo(2L);
        assertThat(vote.getPostType()).isEqualTo("reply");
        assertThat(vote.getVoteValue()).isEqualTo(-1);
    }

    @Test
    void defaultConstructor_fieldsAreDefault() {
        ForumVote vote = new ForumVote();

        assertThat(vote.getId()).isNull();
        assertThat(vote.getVoter()).isNull();
        assertThat(vote.getPostId()).isNull();
        assertThat(vote.getPostType()).isNull();
        assertThat(vote.getVoteValue()).isEqualTo(0);
    }
}
