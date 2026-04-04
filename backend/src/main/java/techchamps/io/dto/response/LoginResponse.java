package techchamps.io.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Login response payload")
public class LoginResponse {

    @Schema(description = "Indicates whether the login was successful", example = "true")
    private boolean success;

    @Schema(description = "Human-readable result message", example = "Login successful")
    private String message;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    @Schema(description = "Username of the authenticated user (null when login fails)", example = "user", nullable = true)
    private String username;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    @Schema(description = "Role of the authenticated user (null when login fails)", example = "USER", nullable = true)
    private String role;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    @Schema(description = "JWT token for authenticated requests (null when login fails)", example = "eyJhbGciOiJIUzI1NiJ9...", nullable = true)
    private String token;

    public LoginResponse() {}

    public LoginResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public LoginResponse(boolean success, String message, String username, String role, String token) {
        this.success = success;
        this.message = message;
        this.username = username;
        this.role = role;
        this.token = token;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
