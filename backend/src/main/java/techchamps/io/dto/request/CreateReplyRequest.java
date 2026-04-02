package techchamps.io.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// CONSTRAINT: reply content max 2000 — must match frontend validation
@Schema(description = "Request body for creating a new forum reply")
public class CreateReplyRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 2000, message = "Reply content must be at most 2000 characters")
    @Schema(description = "Reply content", maxLength = 2000)
    private String content;

    @Schema(description = "Parent reply ID for nested replies (null for direct thread reply)")
    private Long parentReplyId;

    public CreateReplyRequest() {}

    public CreateReplyRequest(String content, Long parentReplyId) {
        this.content = content;
        this.parentReplyId = parentReplyId;
    }

    public String getContent() { return content; }
    public Long getParentReplyId() { return parentReplyId; }

    public void setContent(String content) { this.content = content; }
    public void setParentReplyId(Long parentReplyId) { this.parentReplyId = parentReplyId; }
}
