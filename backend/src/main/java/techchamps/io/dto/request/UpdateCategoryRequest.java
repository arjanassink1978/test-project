package techchamps.io.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request to update an existing forum category")
public class UpdateCategoryRequest {

    // CONSTRAINT: category name required, max 50 chars
    @NotBlank(message = "Name is required")
    @Size(max = 50, message = "Name must be at most 50 characters")
    @Schema(description = "Updated category name", example = "Off-Topic")
    private String name;

    // CONSTRAINT: category description optional, max 200 chars
    @Size(max = 200, message = "Description must be at most 200 characters")
    @Schema(description = "Updated category description (optional)", example = "Discussion of off-topic subjects")
    private String description;

    @Schema(description = "Updated icon identifier (optional)", example = "star")
    private String icon;

    public UpdateCategoryRequest() {}

    public UpdateCategoryRequest(String name, String description, String icon) {
        this.name = name;
        this.description = description;
        this.icon = icon;
    }

    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getIcon() { return icon; }

    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setIcon(String icon) { this.icon = icon; }
}
