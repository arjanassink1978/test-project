package techchamps.io.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "forum_votes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"voter_id", "post_id", "post_type"})
)
public class ForumVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_id", nullable = false)
    private AppUser voter;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "post_type", nullable = false)
    private String postType;

    @Column(name = "vote_value", nullable = false)
    private int voteValue;

    public ForumVote() {}

    public ForumVote(AppUser voter, Long postId, String postType, int voteValue) {
        this.voter = voter;
        this.postId = postId;
        this.postType = postType;
        this.voteValue = voteValue;
    }

    public Long getId() { return id; }
    public AppUser getVoter() { return voter; }
    public Long getPostId() { return postId; }
    public String getPostType() { return postType; }
    public int getVoteValue() { return voteValue; }

    public void setId(Long id) { this.id = id; }
    public void setVoter(AppUser voter) { this.voter = voter; }
    public void setPostId(Long postId) { this.postId = postId; }
    public void setPostType(String postType) { this.postType = postType; }
    public void setVoteValue(int voteValue) { this.voteValue = voteValue; }
}
