package techchamps.io.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// CONSTRAINT: title max 200, description max 5000 — must match frontend validation
@Schema(description = "Request body for creating a new forum thread")
public class CreateThreadRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    @Schema(description = "Thread title", maxLength = 200)
    private String title;

    @Size(max = 5000, message = "Description must be at most 5000 characters")
    @Schema(description = "Thread description", maxLength = 5000)
    private String description;

    @Schema(description = "Category ID")
    private Long categoryId;

    public CreateThreadRequest() {}

    public CreateThreadRequest(String title, String description, Long categoryId) {
        this.title = title;
        this.description = description;
        this.categoryId = categoryId;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Long getCategoryId() { return categoryId; }

    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
}
