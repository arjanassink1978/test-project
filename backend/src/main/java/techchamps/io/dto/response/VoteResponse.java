package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of a vote action")
public class VoteResponse {

    @Schema(description = "ID of the post that was voted on")
    private Long postId;

    @Schema(description = "Type of post: thread or reply")
    private String postType;

    @Schema(description = "New score after the vote")
    private int newScore;

    @Schema(description = "User's current vote: 1, 0, or -1")
    private int userVote;

    public VoteResponse() {}

    public VoteResponse(Long postId, String postType, int newScore, int userVote) {
        this.postId = postId;
        this.postType = postType;
        this.newScore = newScore;
        this.userVote = userVote;
    }

    public Long getPostId() { return postId; }
    public String getPostType() { return postType; }
    public int getNewScore() { return newScore; }
    public int getUserVote() { return userVote; }

    public void setPostId(Long postId) { this.postId = postId; }
    public void setPostType(String postType) { this.postType = postType; }
    public void setNewScore(int newScore) { this.newScore = newScore; }
    public void setUserVote(int userVote) { this.userVote = userVote; }
}
