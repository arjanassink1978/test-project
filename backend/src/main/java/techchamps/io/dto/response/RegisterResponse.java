package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "User registration response payload")
public class RegisterResponse {

    @Schema(description = "ID of the newly created user", example = "1")
    private Long id;

    @Schema(description = "Email address of the registered user", example = "newuser@example.com")
    private String email;

    @Schema(description = "Username of the registered user", example = "newuser")
    private String username;

    @Schema(description = "Indicates whether registration was successful", example = "true")
    private boolean success;

    @Schema(description = "Human-readable result message", example = "Registration successful")
    private String message;

    public RegisterResponse() {}

    public RegisterResponse(Long id, String email, String username, boolean success, String message) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.success = success;
        this.message = message;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
