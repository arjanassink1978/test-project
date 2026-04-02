package techchamps.io.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "Update profile request payload")
public class UpdateProfileRequest {

    @Size(max = 100, message = "Display name must not exceed 100 characters")
    @Schema(description = "Display name", example = "John Doe")
    private String displayName;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    @Schema(description = "Short biography", example = "Software developer and coffee enthusiast")
    private String bio;

    @Size(max = 100, message = "Location must not exceed 100 characters")
    @Schema(description = "Location", example = "Amsterdam, Netherlands")
    private String location;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String displayName, String bio, String location) {
        this.displayName = displayName;
        this.bio = bio;
        this.location = location;
    }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
