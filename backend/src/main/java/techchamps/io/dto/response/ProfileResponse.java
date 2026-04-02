package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "User profile response payload")
public class ProfileResponse {

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "Email address", example = "user@example.com")
    private String email;

    @Schema(description = "Username", example = "user")
    private String username;

    @Schema(description = "Display name", example = "John Doe")
    private String displayName;

    @Schema(description = "Short biography", example = "Software developer and coffee enthusiast")
    private String bio;

    @Schema(description = "Location", example = "Amsterdam, Netherlands")
    private String location;

    @Schema(description = "Avatar URL or base64 data URI", example = "data:image/png;base64,iVBORw0KGgo...")
    private String avatarUrl;

    public ProfileResponse() {}

    public ProfileResponse(Long id, String email, String username, String displayName,
                           String bio, String location, String avatarUrl) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.location = location;
        this.avatarUrl = avatarUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
