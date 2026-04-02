package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Forum thread with full reply tree")
public class ForumThreadDetailResponse extends ForumThreadResponse {

    @Schema(description = "Top-level replies (with nested children)")
    private List<ForumReplyResponse> replies;

    public ForumThreadDetailResponse() {}

    public List<ForumReplyResponse> getReplies() { return replies; }
    public void setReplies(List<ForumReplyResponse> replies) { this.replies = replies; }
}
