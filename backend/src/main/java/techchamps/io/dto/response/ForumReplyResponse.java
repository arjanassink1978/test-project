package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Forum reply details (may include nested replies)")
public class ForumReplyResponse {

    @Schema(description = "Reply ID")
    private Long id;

    @Schema(description = "Reply content")
    private String content;

    @Schema(description = "Reply score")
    private int score;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Username of the reply author")
    private String authorUsername;

    @Schema(description = "Nesting depth (0 = direct reply to thread)")
    private int depth;

    @Schema(description = "Parent reply ID (null if direct reply to thread)")
    private Long parentReplyId;

    @Schema(description = "Nested child replies")
    private List<ForumReplyResponse> replies;

    public ForumReplyResponse() {}

    public Long getId() { return id; }
    public String getContent() { return content; }
    public int getScore() { return score; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getAuthorUsername() { return authorUsername; }
    public int getDepth() { return depth; }
    public Long getParentReplyId() { return parentReplyId; }
    public List<ForumReplyResponse> getReplies() { return replies; }

    public void setId(Long id) { this.id = id; }
    public void setContent(String content) { this.content = content; }
    public void setScore(int score) { this.score = score; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }
    public void setDepth(int depth) { this.depth = depth; }
    public void setParentReplyId(Long parentReplyId) { this.parentReplyId = parentReplyId; }
    public void setReplies(List<ForumReplyResponse> replies) { this.replies = replies; }
}
