package techchamps.io.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Forum thread summary")
public class ForumThreadResponse {

    @Schema(description = "Thread ID")
    private Long id;

    @Schema(description = "Thread title")
    private String title;

    @Schema(description = "Thread description")
    private String description;

    @Schema(description = "Thread score (upvotes - downvotes)")
    private int score;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;

    @Schema(description = "Username of the thread author")
    private String authorUsername;

    @Schema(description = "Category ID")
    private Long categoryId;

    @Schema(description = "Category name")
    private String categoryName;

    @Schema(description = "Total number of replies")
    private int replyCount;

    @Schema(description = "Whether the thread is closed for new replies")
    @JsonProperty("closed")
    private boolean isClosed;

    public ForumThreadResponse() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getScore() { return score; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getAuthorUsername() { return authorUsername; }
    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public int getReplyCount() { return replyCount; }
    public boolean isClosed() { return isClosed; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setScore(int score) { this.score = score; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public void setReplyCount(int replyCount) { this.replyCount = replyCount; }
    public void setIsClosed(boolean isClosed) { this.isClosed = isClosed; }
}
