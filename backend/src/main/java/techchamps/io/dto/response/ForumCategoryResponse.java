package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Forum category details")
public class ForumCategoryResponse {

    @Schema(description = "Category ID")
    private Long id;

    @Schema(description = "Category name")
    private String name;

    @Schema(description = "Category description")
    private String description;

    @Schema(description = "Category icon")
    private String icon;

    public ForumCategoryResponse() {}

    public ForumCategoryResponse(Long id, String name, String description, String icon) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getIcon() { return icon; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setIcon(String icon) { this.icon = icon; }
}
