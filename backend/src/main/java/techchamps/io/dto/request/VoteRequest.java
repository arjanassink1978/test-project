package techchamps.io.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Schema(description = "Request body for voting on a post")
public class VoteRequest {

    @Min(value = -1, message = "Vote value must be -1, 0, or 1")
    @Max(value = 1, message = "Vote value must be -1, 0, or 1")
    @Schema(description = "Vote value: 1 (upvote), 0 (remove vote), -1 (downvote)", allowableValues = {"-1", "0", "1"})
    private int voteValue;

    public VoteRequest() {}

    public VoteRequest(int voteValue) {
        this.voteValue = voteValue;
    }

    public int getVoteValue() { return voteValue; }
    public void setVoteValue(int voteValue) { this.voteValue = voteValue; }
}
