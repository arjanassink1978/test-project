package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Avatar upload response payload")
public class AvatarUploadResponse {

    @Schema(description = "Avatar URL or base64 data URI", example = "data:image/png;base64,iVBORw0KGgo...")
    private String avatarUrl;

    @Schema(description = "Human-readable result message", example = "Avatar uploaded successfully")
    private String message;

    public AvatarUploadResponse() {}

    public AvatarUploadResponse(String avatarUrl, String message) {
        this.avatarUrl = avatarUrl;
        this.message = message;
    }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
